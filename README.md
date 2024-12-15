# Our Team Work

This is a web application for managing team-work operations, including features like user login, check-in management, and fee details. The project consists of a frontend built using React with Vite and a backend built using Express and MySQL.

## Prerequisites

Before starting, make sure you have the following installed:

- [Node.js](https://www.runoob.com/nodejs/nodejs-install-setup.html) 
- [MySQL](https://www.runoob.com/mysql/mysql-install.html)
- [Git](https://www.runoob.com/git/git-install-setup.html)

若运行过程中提示某些Module undefined，可自行搜索安装方法进行安装，或询问我。

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/Endlesswinds/team-work.git
cd team-work
```

### 2. Install Dependencies

#### Backend

Navigate to the backend directory and install dependencies:

```bash
cd backend
npm install
```

#### Frontend

Navigate to the frontend directory and install dependencies:

```bash
cd ../frontend
npm install
```



### 3. Modify Frontend `.env` File

In the `frontend` directory, create or modify the `.env` file, setting the `VITE_HOST` to your local IP address, and specify the API port.

为了跨设备访问，请将设备连接到BUPT-Portal，ip查找方法参考下文。


```bash
// 在frontend文件夹中创建一个名为.env的文件，填入下述内容
VITE_DEV_SERVER_HOST=10.129.95.11 # 输入服务器端IP
VITE_HOST=10.129.95.11 # 输入客户端IP
VITE_API_PORT=8081     # API server port 这个不用修改
```

To find your local IP address, you can use:（先连接到校园网Portal，执行下面的命令，找到命令行ip中以10.129开头的IP）

- **Windows**: Run `ipconfig` in Command Prompt, look for "IPv4 Address".
- **Mac/Linux**: Run `ifconfig` in Terminal, look for your network adapter's IP (e.g., `10.129.x.x`).

Ensure that your phone or other devices are connected to the same local network if you want to access the application from those devices.如果你希望用电脑作服务器，用手机访问，那么手机也得连接同一WiFi BUPT-Portal。

### 4. Set Up Backend Environment Variables

In the `backend` folder, create a `.env` file using the template below, replacing the values with your own configuration if necessary:

```bash
// 在backend文件夹中创建一个名为.env的文件，填入下述内容
JWT_SECRET_KEY=kjf9Kf!a7XzL3P@eG2laj9834JLKJfs!Fjlkjlskdf9234lkj // jwt密钥，替换为任意复杂随机字母数字符号串
HOST=10.129.227.1 // 替换为与上面服务器端相同的IP
DB_HOST=localhost 
DB_USER=username // 替换为你的database username
DB_PASSWORD=pwd // 替换为你的database 密码
DB_NAME=hotel
```

### 5. Set Up MySQL Database

- Open your MySQL client and create a new database:

Windows端：

- 进入mysql（可用cmd，具体方法自行查教程）
- 输入sql指令

```sql
CREATE DATABASE hotel;
```

- Import the SQL file to set up the database schema and data:

1. 将根目录下的`/database/teamwork.sql` 文件导入你的mysql数据库
2. 使用以下命令导入数据库：

```bash
mysql -u root -p hotel < /path/to/your/teamwork.sql
```

- `-u root` 表示 MySQL 用户名，请根据你的实际用户名替换。
- `/path/to/your/teamwork.sql` 是你要导入的 SQL 文件的路径，替换为实际路径。

### 6. Start the Application

#### Backend

Navigate to the `backend` directory and start the Express server:

\```bash
cd backend
npm run start
\```

This will start the backend server on the IP address and port you configured in the `.env` file.

#### Frontend

Navigate to the `frontend` directory and start the Vite development server:

\```bash
cd ../frontend
npm run dev
\```

This will start the frontend on the port you configured (`3000` by default) and make it available at the IP address specified in your `.env` file (e.g., `http://your-local-ip:3000`).

### 7. Access the Application

Open a web browser and navigate to `http://localhost:3000` to view the frontend, and the backend API should be accessible via `http://localhost:8081`. <br />直接打开`http://localhost:3000` 即可从本地访问web页面。

If you are accessing the application from a different device (e.g., your phone), make sure the device is connected to the same network and use your computer's local IP address (e.g., `http://192.168.1.x:3000`).<br />另一设备连接服务器电脑同一wifi，访问http：//你的服务器ip：3000 即可跨设备访问web页面

### Project Structure

```plaintext
team-work/
│
├── backend/                # Backend (Express API)
│   ├── database/           # Database SQL files
│   │   └── hotel.sql       # SQL file for setting up the database
│   ├── node_modules/       # Backend dependencies
│   ├── .env                # Environment variables for backend
│   ├── package-lock.json   # Backend lockfile
│   ├── package.json        # Backend dependencies manifest
│   └── server.js           # Main backend server file
│
├── frontend/               # Frontend (React with Vite)
│   ├── node_modules/       # Frontend dependencies
│   ├── public/             # Public static assets
│   ├── src/                # Source files for React app
│   │   ├── assets/         # Images, styles, etc.
│   │   ├── layouts/        # Layout components
│   │   └── pages/          # Page components
│   ├── .env                # Environment variables for frontend
│   ├── .gitignore          # Ignore files and folders in git
│   ├── eslint.config.js    # ESLint configuration
│   ├── index.html          # HTML entry point for the frontend
│   ├── package-lock.json   # Frontend lockfile
│   ├── package.json        # Frontend dependencies manifest
│   ├── postcss.config.js   # PostCSS configuration
│   ├── README.md           # Project documentation
│   ├── tailwind.config.js  # TailwindCSS configuration
│   └── vite.config.js      # Vite configuration
└── ...
```

### License

This project is licensed under the MIT License.
