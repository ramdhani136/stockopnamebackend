
import ContactController from "../controllers/ContactController";
import { AuthMiddleware } from "../middleware/AuthMiddleware";
import RouteBase from "./RouteBase";

class UserRoutes extends RouteBase {
  routes(): void {
    this.router.get("/", ContactController.index);
    this.router.post("/", ContactController.create);
    this.router.get("/:id", ContactController.show);
    this.router.delete("/:id", ContactController.delete);
    this.router.put("/:id", ContactController.update);
  }
}

export default new UserRoutes().router;
