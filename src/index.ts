import express, { Application } from "express";
import bodyParser from "body-parser";
import morgan from "morgan";
import helmet from "helmet";
import { config as dotenv } from "dotenv";
import cors from "cors";
import compression from "compression";
import DataConnect from "./config/db";
import http from "http";
import {
  HistoryRoutes,
  RoleListRoutes,
  RoleProfileRoutes,
  RoleUserRoutes,
  ScheduleItemPackingRoutes,
  ScheduleItemRoutes,
  ScheduleRoutes,
  UserRoutes,
  workflowActionRoutes,
  WorkflowRoutes,
  WorkflowStateRoutes,
} from "./routes";
import Redis from "./config/Redis";
import { SocketIO } from "./utils";
import { Schedule } from "./models";
import cron from "node-cron";
import { AuthMiddleware } from "./middleware";
import { RoleValidation } from "./middleware/RoleValidation";
const cookieParser = require("cookie-parser");

const corsOptions = {
  origin: ["*", "http://localhost:3000", "http://localhost"],
  credentials: true,
  optionSuccessStatus: 200,
};

class App {
  public app: Application;
  public server: any;
  public io: any;
  public database: DataConnect;

  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.plugins();
    this.database = new DataConnect();
    this.routes();
    this.Cron();
  }

  protected plugins(): void {
    dotenv();
    this.app.use(bodyParser.json());
    this.app.use(compression());
    this.app.use(morgan("dev"));
    this.app.use(helmet());
    this.app.use(cors(corsOptions));
    this.app.use(cookieParser());
    this.io = new SocketIO(this.server).io;
    Redis.getConnect();
  }

  protected Cron(): void {
    cron.schedule("* * * * *", async function () {
      // Cek & close schedule yang sudah melebihi due date
      const today = new Date();
      const startOfToday = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        0,
        0,
        0,
        0
      );
      const update = { $set: { status: "3", workflowState: "Closed" } };
      try {
        await Schedule.updateMany(
          {
            $and: [{ dueDate: { $lt: startOfToday } }, { status: "1" }],
          },
          update
        );
      } catch (error) {
        console.log(error);
      }
      // End
    });
  }

  protected routes(): void {
    this.app.use("/users", UserRoutes);
    this.app.use("/schedule", AuthMiddleware, RoleValidation, ScheduleRoutes);
    this.app.use("/scheduleitem", AuthMiddleware, ScheduleItemRoutes);
    this.app.use("/schedulepacking", AuthMiddleware, ScheduleItemPackingRoutes);
    this.app.use(
      "/roleprofile",
      AuthMiddleware,
      RoleValidation,
      RoleProfileRoutes
    );
    this.app.use("/rolelist", AuthMiddleware, RoleValidation, RoleListRoutes);
    this.app.use("/roleuser", AuthMiddleware, RoleValidation, RoleUserRoutes);
    this.app.use("/history", AuthMiddleware, HistoryRoutes);
    this.app.use("/workflowstate", AuthMiddleware, WorkflowStateRoutes);
    this.app.use("/workflowaction", AuthMiddleware, workflowActionRoutes);
    this.app.use("/workflow", AuthMiddleware, WorkflowRoutes);
  }
}

const port: number = 6000;
const app = new App();
const send = app.database;
const io = app.io;

app.server.listen(port, () => {
  console.log(`Listening on port ${port}`);
});

export { io, send };
