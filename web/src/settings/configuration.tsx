import { parse, ParseError, ParseErrorCode } from '@sqs/jsonc-parser/lib/main'
import { Observable, ReplaySubject } from 'rxjs'
import { map } from 'rxjs/operators'
import * as GQL from '../backend/graphqlschema'
import { Settings } from '../schema/settings.schema'
import { createAggregateError } from '../util/errors'

/**
 * Always represents the entire configuration cascade; i.e., it contains the
 * individual configs from the various config subjects (orgs, user, etc.).
 */
export const configurationCascade = new ReplaySubject<GQL.IConfigurationCascade>(1)

/**
 * Always represents the latest merged configuration for the current user
 * or visitor. Callers should cast the value to their own configuration type.
 */
export const currentConfiguration: Observable<Settings> = configurationCascade.pipe(
    map(cascade => parseJSON(cascade.merged.contents) as Settings)
)

/**
 * Parses the JSON input using the error-tolerant parser used for site config and settings.
 */
export function parseJSON(text: string): any {
    const errors: ParseError[] = []
    const o = parse(text, errors, { allowTrailingComma: true, disallowComments: false })
    if (errors.length > 0) {
        throw createAggregateError(
            errors.map(v => ({
                ...v,
                code: ParseErrorCode[v.error],
                message: `Configuration parse error, code: ${v.error} (offset: ${v.offset}, length: ${v.length})`,
            }))
        )
    }
    return o
}
