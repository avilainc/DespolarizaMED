import type { NextConfig } from "next";
import { withPayload } from "@payloadcms/next/withPayload";

const nextConfig: NextConfig = {
  // standalone: o build emite .next/standalone com um server.js e so as
  // dependencias usadas, o que permite uma imagem de runtime sem node_modules
  // completo (padrao de deploy da casa: build local -> tgz -> imagem).
  output: "standalone",
};

export default withPayload(nextConfig);
