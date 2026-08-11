const Module = require("module");
const originalLoad = Module._load;

Module._load = function (request, parent, isMain) {
  const result = originalLoad.apply(this, arguments);
  if (request === "@next/env" && result && !result.default) {
    result.default = { ...result };
  }
  return result;
};
