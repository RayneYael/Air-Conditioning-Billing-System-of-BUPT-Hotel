import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // 使用 loadEnv 函数加载对应环境的 .env 文件
  const env = loadEnv(mode, process.cwd());

  return {
    server: {
      host: env.VITE_HOST || 'localhost',  // 从 .env 文件中读取 VITE_HOST
      port: 3000,  // 端口号
    },
    plugins: [react()],
  };
});


// import { defineConfig, loadEnv } from 'vite';
// import react from '@vitejs/plugin-react';

// export default defineConfig(({ mode }) => {
//   const env = loadEnv(mode, process.cwd());

//   return {
//     server: {
//       host: '0.0.0.0',  // 绑定到所有网络接口，允许局域网访问
//       port: 3000,
//     },
//     plugins: [react()],
//   };
// });
