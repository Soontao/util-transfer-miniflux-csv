import log from "log";
import pg from "pg";
import * as webdav from "webdav";
import * as csv from "csv";

export async function runJob() {
  log.info("Running job");
  const client = new pg.Client()
  const webdavClient = webdav.createClient(
    process.env.WEBDAV_URL,
    {
      username: process.env.WEBDAV_USERNAME,
      password: process.env.WEBDAV_PASSWORD,
    }
  )
  try {
    await client.connect()
    const result = await client.query(
      {
        rowMode: 'array',
        text: `select
                  hash,
                  f.title as "source" ,
                  e.title,
                  author,
                  "content",
                  url,
                  created_at
                from
                  entries e
                left join feeds f on
                  f.id = e.feed_id
                where
                  created_at > current_timestamp - interval '1' day;
        `
      },
    )
    if (result.rowCount === 0) {
      return log.warning('No newly entries found');
    }
    const remoteFile = webdavClient.createWriteStream(`miniflux_archive_${Date.now()}.csv`)
    const stringifier = csv.stringify({
      bom: true,
      record_delimiter: "unix",
      delimiter: ",",
      header: true,
      encoding: "utf-8",
      quoted: true,
      columns: ['hash', "source", 'title', 'author', 'content', 'url', 'created_at']
    })
    const p = new Promise((resolve, reject) => {
      stringifier.on("error", (error) => { log.error("Error writing to csv: %o", error); reject(error) })
      remoteFile.on("error", (error) => { log.error("Error writing to webdav: %o", error); reject(error) })
      remoteFile.on("end", () => { log.info("Finished writing to webdav"); resolve() })
    })
    stringifier.pipe(remoteFile)
    for (const row of result.rows) { stringifier.write(row) }
    stringifier.end()
    return p
  }
  catch (error) {
    log.error("failed to connect to postgres", error)
  }
  finally {
    await client.end()
  }
}