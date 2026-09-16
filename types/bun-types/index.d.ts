declare module "bun:sqlite" {
  export type SQLQueryBindings = string | bigint | Uint8Array | number | boolean | null | Record<string, string | bigint | Uint8Array | number | boolean | null>;

  export class Statement<ReturnType = unknown, ParamsType = SQLQueryBindings> {
    all(...params: ParamsType[]): ReturnType[];
    get(...params: ParamsType[]): ReturnType | null;
    run(...params: ParamsType[]): { lastInsertRowid: number; changes: number };
    values(...params: ParamsType[]): unknown[][];
    finalize(): void;
  }

  export class Database {
    constructor(filename?: string, options?: { readonly?: boolean; create?: boolean; readwrite?: boolean; safeIntegers?: boolean; strict?: boolean });
    query<ReturnType = unknown, ParamsType = SQLQueryBindings>(sql: string): Statement<ReturnType, ParamsType>;
    prepare<ReturnType = unknown, ParamsType = SQLQueryBindings>(sql: string): Statement<ReturnType, ParamsType>;
    run(sql: string, params?: SQLQueryBindings): { lastInsertRowid: number; changes: number };
    exec(sql: string): { lastInsertRowid: number; changes: number } | void;
    close(throwOnError?: boolean): void;
  }
}
