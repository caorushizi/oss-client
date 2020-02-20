import { on } from "../decorators";
import Controller from "./Controller";

export default class AppController extends Controller {
  @on("test.test")
  getApp() {
    console.log(this);
    console.log(1213123);
  }
}
