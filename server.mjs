import logNode from "log-node";
import express from "express";
import log from "log";
import { CronJob } from "cron";
import { runJob } from "./job.mjs";

logNode()

const job = new CronJob(
  // per day at midnight
  "0 0 0 * * *",
  runJob,
  null,
  false,
  'Asia/Shanghai'
);

const app = express()

app.get("/run", async (req, res) => {
  try {
    await runJob()
  }
  catch (error) {
    return res.status(500).json({
      error
    })
  }
  return res.json({ success: true })
})

app.get("/", (req, res) => {
  return res.json({
    server: "Transfer Server",
  })
})

const server = app.listen(parseInt(process.env.PORT ?? '3000'), () => {
  log.info("server started %o", server.address())
  job.start()
})