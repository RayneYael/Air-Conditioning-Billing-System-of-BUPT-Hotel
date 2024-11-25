-- MySQL dump 10.13  Distrib 8.0.38, for Win64 (x86_64)
--
-- Host: localhost    Database: bupthotel
-- ------------------------------------------------------
-- Server version	8.0.37

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `rooms`
--

DROP TABLE IF EXISTS `roomPeople`;
DROP TABLE IF EXISTS `people`;
DROP TABLE IF EXISTS `rooms`;

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rooms` (
  `roomId` int NOT NULL,
  `roomLevel` enum('标准间','大床房') NOT NULL,
  `cost` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `checkInTime` datetime DEFAULT NULL,
  `checkedIn` tinyint NOT NULL DEFAULT 0,
  PRIMARY KEY (`roomId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rooms`
--

LOCK TABLES `rooms` WRITE;
/*!40000 ALTER TABLE `rooms` DISABLE KEYS */;
INSERT INTO `rooms` VALUES 
        (2001,'标准间', 0, '2024-11-24T14:00:00+08:00', 1),
        (2002,'标准间', 0, NULL, 0),
        (2003,'标准间', 0, NULL, 0),
        (2004,'标准间', 0, NULL, 0),
        (2005,'标准间', 0, NULL, 0),
        (2006,'标准间', 0, NULL, 0),
        (2007,'标准间', 0, NULL, 0),
        (2008,'标准间', 0, NULL, 0),
        (2009,'标准间', 0, NULL, 0),
        (2010,'标准间', 0, NULL, 0),
        (3001,'标准间', 0, NULL, 0),
        (3002,'标准间', 0, NULL, 0),
        (3003,'标准间', 0, NULL, 0),
        (3004,'标准间', 0, NULL, 0),
        (3005,'标准间', 0, NULL, 0),
        (3006,'标准间', 0, NULL, 0),
        (3007,'标准间', 0, NULL, 0),
        (3008,'标准间', 0, NULL, 0),
        (3009,'标准间', 0, NULL, 0),
        (3010,'标准间', 0, NULL, 0),
        (4001,'标准间', 0, NULL, 0),
        (4002,'标准间', 0, NULL, 0),
        (4003,'标准间', 0, NULL, 0),
        (4004,'标准间', 0, NULL, 0),
        (4005,'标准间', 0, NULL, 0),
        (4006,'标准间', 0, NULL, 0),
        (4007,'标准间', 0, NULL, 0),
        (4008,'标准间', 0, NULL, 0),
        (4009,'标准间', 0, NULL, 0),
        (4010,'标准间', 0, NULL, 0),
        (5001,'大床房', 0, NULL, 0),
        (5002,'大床房', 0, NULL, 0),
        (5003,'大床房', 0, NULL, 0),
        (5004,'大床房', 0, NULL, 0),
        (5005,'大床房', 0, NULL, 0),
        (5006,'大床房', 0, NULL, 0),
        (5007,'大床房', 0, NULL, 0),
        (5008,'大床房', 0, NULL, 0),
        (5009,'大床房', 0, NULL, 0),
        (5010,'大床房', 0, NULL, 0);
/*!40000 ALTER TABLE `rooms` ENABLE KEYS */;
UNLOCK TABLES;


-- 创建人员表
CREATE TABLE `people` (
    `peopleId` INT AUTO_INCREMENT PRIMARY KEY,
    `peopleName` VARCHAR(20) NOT NULL
);

-- 创建房间和人员的关联表
CREATE TABLE `roomPeople` (
    `roomId` INT,
    `peopleId` INT,
    PRIMARY KEY (`roomId`, `peopleId`),
    FOREIGN KEY (`roomId`) REFERENCES `rooms`(`roomId`),
    FOREIGN KEY (`peopleId`) REFERENCES `people`(`peopleId`)
);


-- 插入人员数据（不需要指定 peopleId，会自动递增）
LOCK TABLES `people` WRITE;
/*!40000 ALTER TABLE `people` DISABLE KEYS */;
INSERT INTO `people` (`peopleName`) VALUES ('徐坤');
/*!40000 ALTER TABLE `people` ENABLE KEYS */;
UNLOCK TABLES;

-- 插入房间人员关联数据
LOCK TABLES `roomPeople` WRITE;
/*!40000 ALTER TABLE `roomPeople` DISABLE KEYS */;
INSERT INTO `roomPeople` (`roomId`, `peopleId`) VALUES (2001, 1);
/*!40000 ALTER TABLE `roomPeople` ENABLE KEYS */;
UNLOCK TABLES;




--
-- Table structure for table `settings`
--

DROP TABLE IF EXISTS `settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `settings` (
  `roomId` int NOT NULL,
  `roomTemperature` int DEFAULT '26',
  `power` enum('on', 'off') DEFAULT 'off',
  `temperature` int DEFAULT '26',
  `windSpeed` enum('高','中','低') DEFAULT '低',
  `mode` enum('制冷','制热') DEFAULT '制冷',
  `sweep` enum('开', '关') DEFAULT '关',
  `cost` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `totalCost` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  PRIMARY KEY (`roomId`),
  FOREIGN KEY (`roomId`) REFERENCES `rooms`(`roomId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `settings`
--

LOCK TABLES `settings` WRITE;
/*!40000 ALTER TABLE `settings` DISABLE KEYS */;
-- 为每个房间插入默认的空调设置
INSERT INTO `settings` (roomId, roomTemperature, power, temperature, windSpeed, mode, sweep, cost, totalCost)
SELECT 
    roomId,
    26 as roomTemperature,
    'off' as power,
    26 as temperature,
    '低' as windSpeed,
    '制冷' as mode,
    '关' as sweep,
    12.00 as cost,
    24.00 as totalCost
FROM rooms;

UNLOCK TABLES;

--
-- Table structure for table `settings_history`
--

DROP TABLE IF EXISTS `settings_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `settings_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `roomId` int NOT NULL,
  `startTime` datetime NOT NULL,
  `changedSetting` varchar(45) DEFAULT NULL,
  `costPerHour` decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=75 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `settings_history`
--

LOCK TABLES `settings_history` WRITE;
/*!40000 ALTER TABLE `settings_history` DISABLE KEYS */;
INSERT INTO `settings_history` VALUES (60,101,'2024-10-03 17:37:28','isOn: true',5.00),(61,101,'2024-10-03 18:03:10','temperature: 24',5.00),(62,101,'2024-10-04 11:58:32','isOn: false',0.00),(63,101,'2024-10-04 12:17:59','isOn: true',5.00),(64,101,'2024-10-04 12:26:10','isOn: false',0.00),(65,101,'2024-10-04 12:35:41','isOn: true',5.00),(66,101,'2024-10-04 12:35:44','mode: forcedHeating',8.00),(67,101,'2024-10-05 17:21:12','isOn: false',0.00),(68,101,'2024-10-05 19:11:12','isOn: true',5.00),(69,101,'2024-10-05 19:12:18','isOn: false',0.00),(70,101,'2024-10-05 19:12:57','isOn: true',0.00),(71,101,'2024-10-05 19:13:04','mode: strongCooling',10.00),(74,101,'2024-10-08 09:24:05','isOn: false',5.00);
/*!40000 ALTER TABLE `settings_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(45) NOT NULL,
  `password` varchar(45) DEFAULT NULL,
  `role` enum('room','recept_manager','airCon_manager','manager') DEFAULT 'room',
  PRIMARY KEY (`id`),
  UNIQUE KEY `username_UNIQUE` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'101','123','room'),(2,'a','1','airCon_manager'),(3,'q','1','recept_manager'),(4,'z','1','manager');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2024-10-08 10:21:54
