declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    THOKO_OWNER_EMAIL?: string;
    BUCKET?: R2Bucket;
  }
}
