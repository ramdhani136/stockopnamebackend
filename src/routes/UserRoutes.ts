
import UserController from "../controllers/UserController";
import { AuthMiddleware } from "../middleware/AuthMiddleware";
import RouteBase from "./RouteBase";

class UserRoutes extends RouteBase {
  routes(): void {
    this.router.get("/", UserController.index);
    this.router.post("/", UserController.create);
    this.router.get("/:id", UserController.show);
    this.router.delete("/:id", UserController.delete);
  }
}

export default new UserRoutes().router;
