import { readFileSync } from "fs";
import * as yaml from "js-yaml";
import { join } from "path";

const YAML_CONFIG_FILENAME = "config.yaml";
const YAML_CONFIG_FALLBACK_FILENAME = "config.example.yaml";

export default () => {
  try {
    return yaml.load(
      readFileSync(join("./", YAML_CONFIG_FILENAME), "utf8"),
    ) as Record<string, any>;
  } catch (e) {
    return yaml.load(
      readFileSync(join("./", YAML_CONFIG_FALLBACK_FILENAME), "utf8"),
    ) as Record<string, any>;
  }
};
