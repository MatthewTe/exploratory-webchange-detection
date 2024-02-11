export interface IWebsite {
    id: string,
    name: string,
    url: string
    archive_period: string
}

export interface ISnapshot {
    id: string,
    extracted_dt: Date,
    static_dir_root: string,
    website: string
}

export interface ISnapshotComparison {
    id: string,
    source_snapshot: string,
    new_snapshot: string,
    unified_dff: string
}