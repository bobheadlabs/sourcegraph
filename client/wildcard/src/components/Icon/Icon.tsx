import classNames from 'classnames'
import React, { ElementType, SVGProps } from 'react'

import { ICON_SIZES } from './constants'
import styles from './Icon.module.scss'

export interface IconProps extends SVGProps<SVGSVGElement> {
    className?: string
    /**
     * The variant style of the icon. defaults to 'sm'
     */
    size?: typeof ICON_SIZES[number]
    /**
     * Used to change the element that is rendered.
     * Always be mindful of potentially accessibility pitfalls when using this!
     */
    as?: ElementType
    /**
     * Whether to show with icon-inline
     *
     * @default true
     */
    inline?: boolean
    /**
     * Supports src property for image icons
     */
    src?: string
}

export const Icon = React.forwardRef<SVGElement, IconProps>(
    ({ children, inline = true, className, size, as: Component = 'svg', ...attributes }, reference) => (
        <Component
            className={classNames(inline && styles.iconInline, size === 'md' && styles.iconInlineMd, className)}
            ref={reference}
            {...attributes}
        >
            {children}
        </Component>
    )
)
