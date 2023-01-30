
import { UserController } from "../controllers";
import { AuthMiddleware } from "../middleware/AuthMiddleware";
import RouteBase from "./RouteBase";

class UserRoutes extends RouteBase {
  routes(): void {
    this.router.get("/", UserController.index);
    this.router.post("/", UserController.create);
    this.router.get("/:id", UserController.show);
    this.router.delete("/:id", UserController.delete);
    this.router.put("/:id", UserController.update);
  }
}

export default new UserRoutes().router;
