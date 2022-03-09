import classNames from 'classnames'
import { debounce } from 'lodash'
import CheckIcon from 'mdi-react/CheckIcon'
import PencilIcon from 'mdi-react/PencilIcon'
import * as Monaco from 'monaco-editor'
import React, { useState, useRef, useMemo, useCallback } from 'react'
import { of } from 'rxjs'
import { startWith } from 'rxjs/operators'

import { Hoverifier } from '@sourcegraph/codeintellify'
import { isErrorLike } from '@sourcegraph/common'
import { ActionItemAction } from '@sourcegraph/shared/src/actions/ActionItem'
import { HoverMerged } from '@sourcegraph/shared/src/api/client/types/hover'
import { CodeExcerpt } from '@sourcegraph/shared/src/components/CodeExcerpt'
import { ExtensionsControllerProps } from '@sourcegraph/shared/src/extensions/controller'
import { HoverContext } from '@sourcegraph/shared/src/hover/HoverOverlay'
import { PlatformContextProps } from '@sourcegraph/shared/src/platform/context'
import { SymbolIcon } from '@sourcegraph/shared/src/symbols/SymbolIcon'
import { TelemetryProps } from '@sourcegraph/shared/src/telemetry/telemetryService'
import { ThemeProps } from '@sourcegraph/shared/src/theme'
import { useCodeIntelViewerUpdates } from '@sourcegraph/shared/src/util/useCodeIntelViewerUpdates'
import { Alert, LoadingSpinner, useObservable } from '@sourcegraph/wildcard'

import { BlockProps, SymbolBlock, SymbolBlockInput } from '../..'
import { BlockMenuAction, NotebookBlockMenu } from '../menu/NotebookBlockMenu'
import { useCommonBlockMenuActions } from '../menu/useCommonBlockMenuActions'
import blockStyles from '../NotebookBlock.module.scss'
import { useBlockSelection } from '../useBlockSelection'
import { useBlockShortcuts } from '../useBlockShortcuts'

import styles from './NotebookSymbolBlock.module.scss'
import { NotebookSymbolBlockInput } from './NotebookSymbolBlockInput'

interface NotebookSymbolBlockProps
    extends BlockProps,
        SymbolBlock,
        ThemeProps,
        TelemetryProps,
        PlatformContextProps<'requestGraphQL' | 'urlToFile' | 'settings' | 'forceUpdateTooltip'>,
        ExtensionsControllerProps<'extHostAPI' | 'executeCommand'> {
    isMacPlatform: boolean
    sourcegraphSearchLanguageId: string
    hoverifier: Hoverifier<HoverContext, HoverMerged, ActionItemAction>
}

const LOADING = 'LOADING' as const

export const NotebookSymbolBlock: React.FunctionComponent<NotebookSymbolBlockProps> = ({
    id,
    input,
    output,
    telemetryService,
    isSelected,
    isOtherBlockSelected,
    isMacPlatform,
    isReadOnly,
    hoverifier,
    extensionsController,
    isLightTheme,
    onRunBlock,
    onSelectBlock,
    onBlockInputChange,
    ...props
}) => {
    const blockElement = useRef(null)
    const [editor, setEditor] = useState<Monaco.editor.IStandaloneCodeEditor>()
    const [showInputs, setShowInputs] = useState(input.symbolName.length === 0)
    const [symbolQueryInput, setSymbolQueryInput] = useState('')
    const [isInputFocused, setIsInputFocused] = useState(false)

    const debouncedSetSymbolQueryInput = useMemo(() => debounce(setSymbolQueryInput, 300), [setSymbolQueryInput])
    const onSymbolSelected = useCallback(
        input => {
            onBlockInputChange(id, { type: 'symbol', input })
            onRunBlock(id)
        },
        [id, onBlockInputChange, onRunBlock]
    )
    const { onSelect } = useBlockSelection({
        id,
        blockElement: blockElement.current,
        isSelected,
        isInputFocused,
        onSelectBlock,
        ...props,
    })

    const onEnterBlock = useCallback(() => {
        if (showInputs) {
            // setTimeout executes the editor focus in a separate run-loop which prevents adding a newline at the start of the input
            setTimeout(() => editor?.focus(), 0)
        } else {
            setShowInputs(true)
        }
    }, [editor, showInputs, setShowInputs])

    const hideInput = useCallback(() => setShowInputs(false), [setShowInputs])

    const { onKeyDown } = useBlockShortcuts({
        id,
        isMacPlatform,
        onEnterBlock,
        onRunBlock: hideInput,
        ...props,
    })

    const symbolOutput = useObservable(useMemo(() => output?.pipe(startWith(LOADING)) ?? of(undefined), [output]))

    const modifierKeyLabel = isMacPlatform ? '⌘' : 'Ctrl'
    const commonMenuActions = useCommonBlockMenuActions({
        modifierKeyLabel,
        isInputFocused,
        isMacPlatform,
        isReadOnly,
        ...props,
    })

    const toggleEditMenuAction: BlockMenuAction[] = useMemo(
        () => [
            {
                type: 'button',
                label: showInputs ? 'Save' : 'Edit',
                icon: showInputs ? <CheckIcon className="icon-inline" /> : <PencilIcon className="icon-inline" />,
                onClick: () => setShowInputs(!showInputs),
                keyboardShortcutLabel: showInputs ? `${modifierKeyLabel} + ↵` : '↵',
            },
        ],
        [modifierKeyLabel, showInputs, setShowInputs]
    )

    const menuActions = useMemo(() => (!isReadOnly ? toggleEditMenuAction : []).concat(commonMenuActions), [
        isReadOnly,
        toggleEditMenuAction,
        commonMenuActions,
    ])

    const codeIntelViewerUpdatesProps = useMemo(() => ({ extensionsController, ...input }), [
        extensionsController,
        input,
    ])

    const viewerUpdates = useCodeIntelViewerUpdates(codeIntelViewerUpdatesProps)

    return (
        <div className={classNames('block-wrapper', blockStyles.blockWrapper)} data-block-id={id}>
            {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
            <div
                className={classNames(
                    blockStyles.block,
                    styles.block,
                    isSelected && !isInputFocused && blockStyles.selected,
                    isSelected && isInputFocused && blockStyles.selectedNotFocused
                )}
                onClick={onSelect}
                onKeyDown={onKeyDown}
                onFocus={onSelect}
                // A tabIndex is necessary to make the block focusable.
                // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
                tabIndex={0}
                aria-label="Notebook symbol block"
                ref={blockElement}
            >
                <div className={styles.header}>
                    {input.symbolName.length > 0 ? <NotebookSymbolBlockHeader {...input} /> : <>No symbol selected</>}
                </div>
                {showInputs && (
                    <NotebookSymbolBlockInput
                        id={id}
                        editor={editor}
                        symbolQueryInput={symbolQueryInput}
                        isLightTheme={isLightTheme}
                        setEditor={setEditor}
                        setSymbolQueryInput={setSymbolQueryInput}
                        debouncedSetSymbolQueryInput={debouncedSetSymbolQueryInput}
                        onSymbolSelected={onSymbolSelected}
                        setIsInputFocused={setIsInputFocused}
                        onRunBlock={hideInput}
                        onSelectBlock={onSelectBlock}
                        {...props}
                    />
                )}
                {symbolOutput === LOADING && (
                    <div className={classNames('d-flex justify-content-center py-3', styles.highlightedFileWrapper)}>
                        <LoadingSpinner inline={false} />
                    </div>
                )}
                {symbolOutput && symbolOutput !== LOADING && !isErrorLike(symbolOutput) && (
                    <div className={styles.highlightedFileWrapper}>
                        <CodeExcerpt
                            repoName={input.repositoryName}
                            commitID={input.revision}
                            filePath={input.filePath}
                            blobLines={symbolOutput.highlightedLines}
                            highlightRanges={[symbolOutput.highlightSymbolRange]}
                            {...symbolOutput.highlightLineRange}
                            isFirst={false}
                            fetchHighlightedFileRangeLines={() => of([])}
                            hoverifier={hoverifier}
                            viewerUpdates={viewerUpdates}
                        />
                    </div>
                )}
                {symbolOutput && symbolOutput !== LOADING && isErrorLike(symbolOutput) && (
                    <Alert className="m-3" variant="danger">
                        {symbolOutput.message}
                    </Alert>
                )}
            </div>
            {(isSelected || !isOtherBlockSelected) && (
                <NotebookBlockMenu id={id} actions={isSelected ? menuActions : []} />
            )}
        </div>
    )
}

const NotebookSymbolBlockHeader: React.FunctionComponent<SymbolBlockInput> = ({
    repositoryName,
    filePath,
    symbolName,
    symbolContainerName,
    symbolKind,
}) => (
    <>
        <div className="mr-2">
            <SymbolIcon className="icon-inline" kind={symbolKind} />
        </div>
        <div className="d-flex flex-column">
            <code>
                {symbolName} {symbolContainerName && <span className="text-muted">{symbolContainerName}</span>}
            </code>
            <small className="text-muted">
                {repositoryName}/{filePath}
            </small>
        </div>
    </>
)
