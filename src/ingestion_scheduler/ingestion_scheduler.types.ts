import { Parameter } from "postgres"

export interface IWebsite {
    id: string,
    name: string,
    url: string
    archive_period: string
}

export interface ISnapshot {
    id?: string,
    extracted_dt: string,
    static_dir_root: string,
    website: string | Parameter<string>
}

export interface ISnapshotComparison {
    id: string,
    prev_snapshot: string,
    new_snapshot: string,
    unified_dff: string,
    created_on: string
}

export interface ISeleniumContent {
    htmlContent: string,
    pageSnapshot: string,
    extractedDate: string 
}