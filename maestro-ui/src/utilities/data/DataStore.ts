import { resolve } from "../../decorators/inject";
import ApiCaller from "./ApiCaller";
import parseSiren from "siren-parser";

const apiCaller = resolve<ApiCaller>(ApiCaller);



