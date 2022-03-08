import classNames from 'classnames'
import ArchiveIcon from 'mdi-react/ArchiveIcon'
import LockIcon from 'mdi-react/LockIcon'
import SourceForkIcon from 'mdi-react/SourceForkIcon'
import React from 'react'

import { LastSyncedIcon } from '@sourcegraph/shared/src/components/LastSyncedIcon'
import { displayRepoName } from '@sourcegraph/shared/src/components/RepoFileLink'
import { RepoIcon } from '@sourcegraph/shared/src/components/RepoIcon'
import { ResultContainer } from '@sourcegraph/shared/src/components/ResultContainer'
import { SearchResultStar } from '@sourcegraph/shared/src/components/SearchResultStar'
import { PlatformContextProps } from '@sourcegraph/shared/src/platform/context'
import { CommitMatch, getRepoMatchLabel, getRepoMatchUrl, RepositoryMatch } from '@sourcegraph/shared/src/search/stream'
import { formatRepositoryStarCount } from '@sourcegraph/shared/src/util/stars'
import { Timestamp } from '@sourcegraph/web/src/components/time/Timestamp'
import { Link } from '@sourcegraph/wildcard'

import { CommitSearchResultMatch } from './CommitSearchResultMatch'
import styles from './SearchResult.module.scss'

interface Props extends PlatformContextProps<'requestGraphQL'> {
    result: CommitMatch | RepositoryMatch
    repoName: string
    icon: React.ComponentType<{ className?: string }>
    onSelect: () => void
    openInNewTab?: boolean
}

export const SearchResult: React.FunctionComponent<Props> = ({
    result,
    icon,
    repoName,
    platformContext,
    onSelect,
    openInNewTab,
}) => {
    const renderTitle = (): JSX.Element => {
        const formattedRepositoryStarCount = formatRepositoryStarCount(result.repoStars)
        return (
            <div className={styles.title}>
                <RepoIcon repoName={repoName} className="icon-inline text-muted flex-shrink-0" />
                {result.type === 'commit' && (
                    <>
                        &nbsp;
                        <Link to={'/' + encodeURI(result.repository)}>{result.repository}</Link>
                        &nbsp;›&nbsp;
                        <Link to={'/' + encodeURI(result.repository) + '/-/commit/' + result.oid}>
                            {result.authorName}
                        </Link>
                        :&nbsp;
                        <Link to={'/' + encodeURI(result.repository) + '/-/commit/' + result.oid}>
                            {result.message.split('\n', 1)[0]}
                        </Link>
                    </>
                )}
                {result.type === 'repo' && (
                    <Link to={getRepoMatchUrl(result)}>{displayRepoName(getRepoMatchLabel(result))}</Link>
                )}
                <span className={styles.spacer} />
                {result.type === 'commit' && (
                    <Link to={'/' + encodeURI(result.repository) + '/-/commit/' + result.oid}>
                        <code>{result.oid.slice(0, 7)}</code>
                        &nbsp;
                        <Timestamp date={result.authorDate} noAbout={true} />
                    </Link>
                )}
                {result.type === 'commit' && result.detail && formattedRepositoryStarCount && (
                    <div className={styles.divider} />
                )}
                {formattedRepositoryStarCount && (
                    <>
                        <SearchResultStar />
                        {formattedRepositoryStarCount}
                    </>
                )}
            </div>
        )
    }

    const renderBody = (): JSX.Element => {
        if (result.type === 'repo') {
            return (
                <div data-testid="search-repo-result">
                    <div className={classNames(styles.searchResultMatch, 'p-2 flex-column')}>
                        {result.repoLastFetched && <LastSyncedIcon lastSyncedTime={result.repoLastFetched} />}
                        <div className="d-flex align-items-center flex-row">
                            <div className={styles.matchType}>
                                <small>Repository match</small>
                            </div>
                            {result.fork && (
                                <>
                                    <div className={styles.divider} />
                                    <div>
                                        <SourceForkIcon
                                            className={classNames('icon-inline flex-shrink-0 text-muted', styles.icon)}
                                        />
                                    </div>
                                    <div>
                                        <small>Fork</small>
                                    </div>
                                </>
                            )}
                            {result.archived && (
                                <>
                                    <div className={styles.divider} />
                                    <div>
                                        <ArchiveIcon
                                            className={classNames('icon-inline flex-shrink-0 text-muted', styles.icon)}
                                        />
                                    </div>
                                    <div>
                                        <small>Archived</small>
                                    </div>
                                </>
                            )}
                            {result.private && (
                                <>
                                    <div className={styles.divider} />
                                    <div>
                                        <LockIcon
                                            className={classNames('icon-inline flex-shrink-0 text-muted', styles.icon)}
                                        />
                                    </div>
                                    <div>
                                        <small>Private</small>
                                    </div>
                                </>
                            )}
                        </div>
                        {result.description && (
                            <>
                                <div className={styles.dividerVertical} />
                                <div>
                                    <small>
                                        <em>{result.description}</em>
                                    </small>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )
        }

        return (
            <CommitSearchResultMatch
                key={result.url}
                item={result}
                platformContext={platformContext}
                openInNewTab={openInNewTab}
            />
        )
    }

    return (
        <ResultContainer
            icon={icon}
            collapsible={false}
            defaultExpanded={true}
            title={renderTitle()}
            resultType={result.type}
            onResultClicked={onSelect}
            expandedChildren={renderBody()}
        />
    )
}
