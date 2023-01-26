import express, { Application, Request, Response } from "express";
import bodyParser from "body-parser";
import morgan from "morgan";
import helmet from "helmet";
import { config as dotenv } from "dotenv";
import cors from "cors";
import compression from "compression";
import UserRoutes from "./routes/UserRoutes";
import DataConnect from "./config/db";
import http from "http";
import SocketIO from "./utils/SocketIO";
import ContactRoutes from "./routes/ContactRoutes";

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
    dotenv();
    this.plugins();
    this.database = new DataConnect();
    this.routes();
  }

  protected plugins(): void {
    this.app.use(bodyParser.json());
    this.app.use(compression());
    this.app.use(morgan("dev"));
    this.app.use(helmet());
    this.app.use(cors(corsOptions));
    // socketio
    this.io = new SocketIO(this.server).io;
  }

  protected routes(): void {
    this.app.use("/users", UserRoutes);
    this.app.use("/contacts", ContactRoutes);
  }
}

const port: number = 5000;
const app = new App();
const send = app.database;
const io = app.io;

app.server.listen(port, () => {
  console.log(`Listening on port ${port}`);
});


export { io, send };
