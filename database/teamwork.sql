-- MySQL dump 10.13  Distrib 8.0.38, for Win64 (x86_64)
--
-- Host: localhost    Database: teamwork
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
-- Table structure for table `aircon_history`
--

DROP TABLE IF EXISTS `aircon_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `aircon_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `roomId` int NOT NULL,
  `time` datetime NOT NULL,
  `power` enum('on','off') NOT NULL DEFAULT 'off',
  `temperature` int NOT NULL DEFAULT '26',
  `windSpeed` enum('高','中','低') NOT NULL DEFAULT '低',
  `mode` enum('制冷','制热') NOT NULL DEFAULT '制冷',
  `sweep` enum('开','关') NOT NULL DEFAULT '关',
  `cost` decimal(10,2) NOT NULL DEFAULT '0.00',
  PRIMARY KEY (`id`),
  KEY `fk_roomId` (`roomId`),
  CONSTRAINT `fk_roomId` FOREIGN KEY (`roomId`) REFERENCES `rooms` (`roomId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `aircon_history`
--

LOCK TABLES `aircon_history` WRITE;
/*!40000 ALTER TABLE `aircon_history` DISABLE KEYS */;
/*!40000 ALTER TABLE `aircon_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `central_settings`
--

DROP TABLE IF EXISTS `central_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `central_settings` (
  `mode` enum('制冷','制热') NOT NULL,
  `resourceLimit` int NOT NULL,
  `lowSpeedRate` float NOT NULL,
  `midSpeedRate` float NOT NULL,
  `highSpeedRate` float NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `central_settings`
--

LOCK TABLES `central_settings` WRITE;
/*!40000 ALTER TABLE `central_settings` DISABLE KEYS */;
INSERT INTO `central_settings` VALUES ('制热',3,0.5,1,2);
/*!40000 ALTER TABLE `central_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `checkin_history`
--

DROP TABLE IF EXISTS `checkin_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `checkin_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `roomId` varchar(45) DEFAULT NULL,
  `checkInTime` datetime NOT NULL,
  `checkOutTime` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `checkin_history`
--

LOCK TABLES `checkin_history` WRITE;
/*!40000 ALTER TABLE `checkin_history` DISABLE KEYS */;
INSERT INTO `checkin_history` VALUES (1,'2001','2024-12-12 15:00:00',NULL),(2,'2002','2024-12-12 15:00:00',NULL),(3,'2003','2024-12-12 15:00:00',NULL),(4,'2004','2024-12-12 15:00:00',NULL),(5,'2005','2024-12-12 15:00:00',NULL);
/*!40000 ALTER TABLE `checkin_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `people`
--

DROP TABLE IF EXISTS `people`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `people` (
  `peopleId` int NOT NULL AUTO_INCREMENT,
  `peopleName` varchar(20) NOT NULL,
  PRIMARY KEY (`peopleId`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `people`
--

LOCK TABLES `people` WRITE;
/*!40000 ALTER TABLE `people` DISABLE KEYS */;
INSERT INTO `people` VALUES (1,'一号'),(2,'二号'),(3,'三号'),(4,'四号'),(5,'五号'),(6,'张三'),(7,'张三'),(8,'张三'),(9,'彭鲲'),(10,'彭鲲'),(11,'彭鲲'),(12,'彭鲲'),(13,'彭鲲'),(14,'彭鲲');
/*!40000 ALTER TABLE `people` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roompeople`
--

DROP TABLE IF EXISTS `roompeople`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roompeople` (
  `roomId` int NOT NULL,
  `peopleId` int NOT NULL,
  PRIMARY KEY (`roomId`,`peopleId`),
  KEY `peopleId` (`peopleId`),
  CONSTRAINT `roompeople_ibfk_1` FOREIGN KEY (`roomId`) REFERENCES `rooms` (`roomId`),
  CONSTRAINT `roompeople_ibfk_2` FOREIGN KEY (`peopleId`) REFERENCES `people` (`peopleId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roompeople`
--

LOCK TABLES `roompeople` WRITE;
/*!40000 ALTER TABLE `roompeople` DISABLE KEYS */;
INSERT INTO `roompeople` VALUES (2001,10),(2002,11),(2003,12),(2004,13),(2005,14);
/*!40000 ALTER TABLE `roompeople` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rooms`
--

DROP TABLE IF EXISTS `rooms`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rooms` (
  `roomId` int NOT NULL,
  `roomLevel` enum('标准间','大床房') NOT NULL,
  `cost` decimal(10,2) NOT NULL DEFAULT '0.00',
  `checkInTime` datetime DEFAULT NULL,
  `checkedIn` tinyint NOT NULL DEFAULT '0',
  PRIMARY KEY (`roomId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rooms`
--

LOCK TABLES `rooms` WRITE;
/*!40000 ALTER TABLE `rooms` DISABLE KEYS */;
INSERT INTO `rooms` VALUES (2001,'标准间',0.00,'2024-12-12 15:00:00',1),(2002,'标准间',0.00,'2024-12-12 15:00:00',1),(2003,'标准间',0.00,'2024-12-12 15:00:00',1),(2004,'标准间',0.00,'2024-12-12 15:00:00',1),(2005,'标准间',0.00,'2024-12-12 15:00:00',1),(2006,'标准间',0.00,NULL,0),(2007,'标准间',0.00,NULL,0),(2008,'标准间',0.00,NULL,0),(2009,'标准间',0.00,NULL,0),(2010,'标准间',0.00,NULL,0),(3001,'标准间',0.00,NULL,0),(3002,'标准间',0.00,NULL,0),(3003,'标准间',0.00,NULL,0),(3004,'标准间',0.00,NULL,0),(3005,'标准间',0.00,NULL,0),(3006,'标准间',0.00,NULL,0),(3007,'标准间',0.00,NULL,0),(3008,'标准间',0.00,NULL,0),(3009,'标准间',0.00,NULL,0),(3010,'标准间',0.00,NULL,0),(4001,'标准间',0.00,NULL,0),(4002,'标准间',0.00,NULL,0),(4003,'标准间',0.00,NULL,0),(4004,'标准间',0.00,NULL,0),(4005,'标准间',0.00,NULL,0),(4006,'标准间',0.00,NULL,0),(4007,'标准间',0.00,NULL,0),(4008,'标准间',0.00,NULL,0),(4009,'标准间',0.00,NULL,0),(4010,'标准间',0.00,NULL,0),(5001,'大床房',0.00,NULL,0),(5002,'大床房',0.00,NULL,0),(5003,'大床房',0.00,NULL,0),(5004,'大床房',0.00,NULL,0),(5005,'大床房',0.00,NULL,0),(5006,'大床房',0.00,NULL,0),(5007,'大床房',0.00,NULL,0),(5008,'大床房',0.00,NULL,0),(5009,'大床房',0.00,NULL,0),(5010,'大床房',0.00,NULL,0);
/*!40000 ALTER TABLE `rooms` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `schedule_history`
--

DROP TABLE IF EXISTS `schedule_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `schedule_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `roomId` int NOT NULL,
  `requestTime` datetime DEFAULT NULL,
  `start_time` datetime DEFAULT NULL,
  `end_time` datetime DEFAULT NULL,
  `duration` int DEFAULT NULL,
  `status` enum('running','waiting','off') DEFAULT NULL,
  `target_temp` int DEFAULT NULL,
  `current_temp` int DEFAULT NULL,
  `wind_speed` enum('高','中','低') DEFAULT NULL,
  `mode` enum('制冷','制热') DEFAULT NULL,
  `remainTimeSlice` int DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `schedule_history`
--

LOCK TABLES `schedule_history` WRITE;
/*!40000 ALTER TABLE `schedule_history` DISABLE KEYS */;
/*!40000 ALTER TABLE `schedule_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `schedule_queue`
--

DROP TABLE IF EXISTS `schedule_queue`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `schedule_queue` (
  `id` int NOT NULL AUTO_INCREMENT,
  `time` datetime DEFAULT NULL,
  `waitingQueue` json DEFAULT NULL,
  `runningQueue` json DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `schedule_queue`
--

LOCK TABLES `schedule_queue` WRITE;
/*!40000 ALTER TABLE `schedule_queue` DISABLE KEYS */;
/*!40000 ALTER TABLE `schedule_queue` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `settings`
--

DROP TABLE IF EXISTS `settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `settings` (
  `roomId` int NOT NULL,
  `power` enum('on','off') NOT NULL DEFAULT 'off',
  `roomTemperature` int NOT NULL DEFAULT '26',
  `setTemperature` int NOT NULL DEFAULT '26',
  `initTemperature` int NOT NULL DEFAULT '26',
  `windSpeed` enum('高','中','低') NOT NULL DEFAULT '低',
  `mode` enum('制冷','制热') NOT NULL DEFAULT '制冷',
  `sweep` enum('开','关') NOT NULL DEFAULT '关',
  `cost` decimal(10,2) NOT NULL DEFAULT '0.00',
  `totalCost` decimal(10,2) NOT NULL DEFAULT '0.00',
  PRIMARY KEY (`roomId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `settings`
--

LOCK TABLES `settings` WRITE;
/*!40000 ALTER TABLE `settings` DISABLE KEYS */;
INSERT INTO `settings` VALUES (2001,'off',10,26,10,'中','制热','关',0.00,0.00),(2002,'off',15,26,15,'中','制热','关',0.00,0.00),(2003,'off',18,26,18,'中','制热','关',0.00,0.00),(2004,'off',12,26,12,'中','制热','关',0.00,0.00),(2005,'off',14,26,14,'中','制热','关',0.00,0.00),(2006,'off',26,26,26,'中','制热','关',0.00,0.00),(2007,'off',26,26,26,'中','制热','关',0.00,0.00),(2008,'off',26,26,26,'中','制热','关',0.00,0.00),(2009,'off',26,26,26,'中','制热','关',0.00,0.00),(2010,'off',26,26,26,'中','制热','关',0.00,0.00),(3001,'off',26,26,26,'中','制热','关',0.00,0.00),(3002,'off',26,26,26,'中','制热','关',0.00,0.00),(3003,'off',26,26,26,'中','制热','关',0.00,0.00),(3004,'off',26,26,26,'中','制热','关',0.00,0.00),(3005,'off',26,26,26,'中','制热','关',0.00,0.00),(3006,'off',26,26,26,'中','制热','关',0.00,0.00),(3007,'off',26,26,26,'中','制热','关',0.00,0.00),(3008,'off',26,26,26,'中','制热','关',0.00,0.00),(3009,'off',26,26,26,'中','制热','关',0.00,0.00),(3010,'off',26,26,26,'中','制热','关',0.00,0.00),(4001,'off',26,26,26,'中','制热','关',0.00,0.00),(4002,'off',26,26,26,'中','制热','关',0.00,0.00),(4003,'off',26,26,26,'中','制热','关',0.00,0.00),(4004,'off',26,26,26,'中','制热','关',0.00,0.00),(4005,'off',26,26,26,'中','制热','关',0.00,0.00),(4006,'off',26,26,26,'中','制热','关',0.00,0.00),(4007,'off',26,26,26,'中','制热','关',0.00,0.00),(4008,'off',26,26,26,'中','制热','关',0.00,0.00),(4009,'off',26,26,26,'中','制热','关',0.00,0.00),(4010,'off',26,26,26,'中','制热','关',0.00,0.00),(5001,'off',26,26,26,'中','制热','关',0.00,0.00),(5002,'off',26,26,26,'中','制热','关',0.00,0.00),(5003,'off',26,26,26,'中','制热','关',0.00,0.00),(5004,'off',26,26,26,'中','制热','关',0.00,0.00),(5005,'off',26,26,26,'中','制热','关',0.00,0.00),(5006,'off',26,26,26,'中','制热','关',0.00,0.00),(5007,'off',26,26,26,'中','制热','关',0.00,0.00),(5008,'off',26,26,26,'中','制热','关',0.00,0.00),(5009,'off',26,26,26,'中','制热','关',0.00,0.00),(5010,'off',26,26,26,'中','制热','关',0.00,0.00);
/*!40000 ALTER TABLE `settings` ENABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=78 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `settings_history`
--

LOCK TABLES `settings_history` WRITE;
/*!40000 ALTER TABLE `settings_history` DISABLE KEYS */;
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
  `role` enum('房间','前台服务','空调管理','酒店经理') NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username_UNIQUE` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (5,'2001','123','房间'),(9,'z','1','酒店经理'),(10,'a','1','前台服务'),(11,'q','1','空调管理'),(12,'front_desk','front_desk','前台服务'),(13,'ac_manager','ac_manager','空调管理'),(14,'manager','manager','酒店经理');
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

-- Dump completed on 2024-12-15 10:08:37
