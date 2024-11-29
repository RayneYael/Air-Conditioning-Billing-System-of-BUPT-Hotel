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
) ENGINE=InnoDB AUTO_INCREMENT=106 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `aircon_history`
--

LOCK TABLES `aircon_history` WRITE;
/*!40000 ALTER TABLE `aircon_history` DISABLE KEYS */;
INSERT INTO `aircon_history` VALUES (1,2002,'2024-11-27 09:07:39','on',25,'中','制冷','开',0.00),(2,2002,'2024-11-27 09:08:53','on',25,'中','制冷','开',0.00),(3,2002,'2024-11-27 09:13:59','on',25,'高','制冷','开',0.00),(4,2002,'2024-11-27 09:15:51','on',25,'高','制冷','开',0.00),(5,2002,'2024-11-27 09:17:00','on',25,'高','制冷','开',0.00),(6,2002,'2024-11-27 09:17:56','on',25,'高','制冷','开',0.00),(7,2002,'2024-11-27 09:18:56','on',25,'高','制冷','开',0.00),(8,2002,'2024-11-27 09:19:26','on',25,'高','制冷','开',0.00),(9,2002,'2024-11-27 09:29:33','on',25,'高','制冷','开',1.69),(10,2003,'2024-11-27 12:51:50','on',25,'低','制冷','开',0.00),(11,2003,'2024-11-27 12:53:22','on',25,'中','制冷','开',0.13),(12,2003,'2024-11-29 14:59:10','on',25,'中','制冷','开',0.00),(13,2001,'2024-11-29 14:59:27','on',25,'中','制冷','开',0.00),(14,2010,'2024-11-29 14:59:28','on',23,'中','制冷','开',0.00),(15,2003,'2024-11-29 15:05:03','on',25,'中','制冷','开',0.15),(16,2010,'2024-11-29 15:07:01','on',23,'中','制冷','开',0.00),(17,2010,'2024-11-29 15:10:29','on',23,'中','制冷','开',0.00),(18,2001,'2024-11-29 15:12:41','on',26,'低','制冷','关',0.00),(19,2001,'2024-11-29 15:12:42','on',26,'中','制冷','关',0.00),(20,2001,'2024-11-29 15:12:43','on',26,'低','制冷','关',0.00),(21,2001,'2024-11-29 15:12:43','on',26,'低','制冷','开',0.00),(22,2001,'2024-11-29 15:21:01','off',26,'低','制冷','开',0.17),(23,2001,'2024-11-29 15:21:02','on',26,'低','制冷','开',0.00),(24,2001,'2024-11-29 15:21:02','off',26,'低','制冷','开',0.00),(25,2001,'2024-11-29 15:21:03','on',26,'低','制冷','开',0.00),(26,2001,'2024-11-29 15:21:03','off',26,'低','制冷','开',0.00),(27,2001,'2024-11-29 15:21:03','on',26,'低','制冷','开',0.00),(28,2001,'2024-11-29 15:21:03','off',26,'低','制冷','开',0.00),(29,2001,'2024-11-29 15:21:04','on',26,'低','制冷','开',0.00),(30,2001,'2024-11-29 15:21:04','off',26,'低','制冷','开',0.00),(31,2001,'2024-11-29 15:21:04','on',26,'低','制冷','开',0.00),(32,2001,'2024-11-29 15:21:04','off',26,'低','制冷','开',0.00),(33,2001,'2024-11-29 15:21:04','on',26,'低','制冷','开',0.00),(34,2001,'2024-11-29 15:21:04','off',26,'低','制冷','开',0.00),(35,2001,'2024-11-29 15:21:04','on',26,'低','制冷','开',0.00),(36,2001,'2024-11-29 15:21:04','off',26,'低','制冷','开',0.00),(37,2001,'2024-11-29 15:21:05','on',26,'低','制冷','开',0.00),(38,2001,'2024-11-29 15:21:05','off',26,'低','制冷','开',0.00),(39,2001,'2024-11-29 15:21:05','on',26,'低','制冷','开',0.00),(40,2001,'2024-11-29 15:21:05','on',26,'低','制冷','开',0.00),(41,2001,'2024-11-29 15:21:05','off',26,'低','制冷','开',0.00),(42,2001,'2024-11-29 15:21:05','on',26,'低','制冷','开',0.00),(43,2001,'2024-11-29 15:21:05','off',26,'低','制冷','开',0.00),(44,2001,'2024-11-29 15:21:05','on',26,'低','制冷','开',0.00),(45,2001,'2024-11-29 15:21:05','off',26,'低','制冷','开',0.00),(46,2001,'2024-11-29 15:21:05','on',26,'低','制冷','开',0.00),(47,2001,'2024-11-29 15:21:06','off',26,'低','制冷','开',0.00),(48,2001,'2024-11-29 15:21:06','on',26,'低','制冷','开',0.00),(49,2001,'2024-11-29 15:21:07','on',25,'低','制冷','开',0.00),(50,2001,'2024-11-29 15:21:07','on',24,'低','制冷','开',0.00),(51,2001,'2024-11-29 15:21:07','on',23,'低','制冷','开',0.00),(52,2001,'2024-11-29 15:21:07','on',22,'低','制冷','开',0.00),(53,2001,'2024-11-29 15:21:07','on',21,'低','制冷','开',0.00),(54,2001,'2024-11-29 15:21:07','on',21,'低','制冷','开',0.00),(55,2001,'2024-11-29 15:21:07','on',20,'低','制冷','开',0.00),(56,2001,'2024-11-29 15:21:07','on',19,'低','制冷','开',0.00),(57,2001,'2024-11-29 15:21:07','on',18,'低','制冷','开',0.00),(58,2001,'2024-11-29 15:21:07','on',17,'低','制冷','开',0.00),(59,2001,'2024-11-29 15:21:07','on',16,'低','制冷','开',0.00),(60,2001,'2024-11-29 15:21:07','on',16,'低','制冷','开',0.00),(61,2001,'2024-11-29 15:21:07','on',16,'低','制冷','开',0.00),(62,2001,'2024-11-29 15:21:07','on',16,'低','制冷','开',0.00),(63,2001,'2024-11-29 15:21:07','on',16,'低','制冷','开',0.00),(64,2001,'2024-11-29 15:21:07','on',16,'低','制冷','开',0.00),(65,2001,'2024-11-29 15:21:07','on',16,'低','制冷','开',0.00),(66,2001,'2024-11-29 15:21:07','on',16,'低','制冷','开',0.00),(67,2001,'2024-11-29 15:21:08','on',17,'低','制冷','开',0.00),(68,2001,'2024-11-29 15:21:08','on',18,'低','制冷','开',0.00),(69,2001,'2024-11-29 15:21:08','on',19,'低','制冷','开',0.00),(70,2001,'2024-11-29 15:21:08','on',20,'低','制冷','开',0.00),(71,2001,'2024-11-29 15:21:08','on',21,'低','制冷','开',0.00),(72,2001,'2024-11-29 15:21:08','on',22,'低','制冷','开',0.00),(73,2001,'2024-11-29 15:21:08','on',23,'低','制冷','开',0.00),(74,2001,'2024-11-29 15:21:08','on',24,'低','制冷','开',0.00),(75,2001,'2024-11-29 15:21:09','on',25,'低','制冷','开',0.00),(76,2001,'2024-11-29 15:21:10','on',25,'低','制冷','开',0.00),(77,2001,'2024-11-29 15:21:10','on',25,'中','制冷','开',0.00),(78,2001,'2024-11-29 15:21:20','off',25,'中','制冷','开',0.00),(79,2001,'2024-11-29 15:21:22','on',25,'中','制冷','开',0.00),(80,2001,'2024-11-29 15:21:23','off',25,'中','制冷','开',0.00),(81,2001,'2024-11-29 15:21:23','on',25,'中','制冷','开',0.00),(82,2001,'2024-11-29 15:21:24','off',25,'中','制冷','开',0.00),(83,2001,'2024-11-29 15:21:25','on',25,'中','制冷','开',0.00),(84,2001,'2024-11-29 15:21:25','off',25,'中','制冷','开',0.00),(85,2001,'2024-11-29 15:21:25','on',25,'中','制冷','开',0.00),(86,2001,'2024-11-29 15:21:25','off',25,'中','制冷','开',0.00),(87,2001,'2024-11-29 15:21:25','on',25,'中','制冷','开',0.00),(88,2001,'2024-11-29 15:21:26','off',25,'中','制冷','开',0.00),(89,2001,'2024-11-29 15:21:26','on',25,'中','制冷','开',0.00),(90,2001,'2024-11-29 15:21:26','off',25,'中','制冷','开',0.00),(91,2001,'2024-11-29 15:21:26','on',25,'中','制冷','开',0.00),(92,2001,'2024-11-29 15:21:26','off',25,'中','制冷','开',0.00),(93,2001,'2024-11-29 15:21:26','on',25,'中','制冷','开',0.00),(94,2001,'2024-11-29 15:21:27','off',25,'中','制冷','开',0.00),(95,2001,'2024-11-29 15:21:27','on',25,'中','制冷','开',0.00),(96,2001,'2024-11-29 15:21:27','off',25,'中','制冷','开',0.00),(97,2001,'2024-11-29 15:21:27','on',25,'中','制冷','开',0.00),(98,2001,'2024-11-29 15:21:27','off',25,'中','制冷','开',0.00),(99,2001,'2024-11-29 15:21:27','on',25,'中','制冷','开',0.00),(100,2001,'2024-11-29 15:21:28','off',25,'中','制冷','开',0.00),(101,2001,'2024-11-29 15:22:05','on',25,'中','制冷','开',0.00),(102,2001,'2024-11-29 15:22:05','off',25,'中','制冷','开',0.00),(103,2001,'2024-11-29 15:22:06','on',25,'中','制冷','开',0.00),(104,2001,'2024-11-29 15:31:07','off',26,'中','制冷','关',0.00),(105,2001,'2024-11-29 15:31:08','off',26,'低','制冷','关',0.00);
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
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `checkin_history`
--

LOCK TABLES `checkin_history` WRITE;
/*!40000 ALTER TABLE `checkin_history` DISABLE KEYS */;
INSERT INTO `checkin_history` VALUES (1,'2001','2024-11-29 14:05:49','2024-11-29 15:53:35'),(2,'2002','2024-11-29 14:05:56','2024-11-29 15:53:39'),(3,'2003','2024-11-29 14:06:02','2024-11-29 15:05:53'),(4,'2001','2024-11-29 14:54:13','2024-11-29 15:53:35'),(5,'2003','2024-11-29 15:05:33','2024-11-29 15:05:53'),(6,'2001','2024-11-29 15:07:18','2024-11-29 15:53:35'),(7,'2001','2024-11-29 15:07:57','2024-11-29 15:53:35'),(8,'2001','2024-11-29 15:08:08','2024-11-29 15:53:35'),(9,'2001','2024-11-29 15:22:18','2024-11-29 15:53:35'),(10,'2001','2024-11-29 15:53:49',NULL);
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
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `people`
--

LOCK TABLES `people` WRITE;
/*!40000 ALTER TABLE `people` DISABLE KEYS */;
INSERT INTO `people` VALUES (1,'徐坤'),(2,'张三'),(3,'小李'),(4,'小王'),(5,'小李'),(6,'张三'),(7,'李四'),(8,'王五'),(9,'张三'),(10,'小李'),(11,'张三'),(12,'pk'),(13,'pk'),(14,'pk'),(15,'小李');
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
INSERT INTO `roompeople` VALUES (2001,15);
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
INSERT INTO `rooms` VALUES (2001,'标准间',0.00,'2024-11-29 15:53:49',1),(2002,'标准间',0.00,NULL,0),(2003,'标准间',0.00,NULL,0),(2004,'标准间',0.00,NULL,0),(2005,'标准间',0.00,NULL,0),(2006,'标准间',0.00,NULL,0),(2007,'标准间',0.00,NULL,0),(2008,'标准间',0.00,NULL,0),(2009,'标准间',0.00,NULL,0),(2010,'标准间',0.00,NULL,0),(3001,'标准间',0.00,NULL,0),(3002,'标准间',0.00,NULL,0),(3003,'标准间',0.00,NULL,0),(3004,'标准间',0.00,NULL,0),(3005,'标准间',0.00,NULL,0),(3006,'标准间',0.00,NULL,0),(3007,'标准间',0.00,NULL,0),(3008,'标准间',0.00,NULL,0),(3009,'标准间',0.00,NULL,0),(3010,'标准间',0.00,NULL,0),(4001,'标准间',0.00,NULL,0),(4002,'标准间',0.00,NULL,0),(4003,'标准间',0.00,NULL,0),(4004,'标准间',0.00,NULL,0),(4005,'标准间',0.00,NULL,0),(4006,'标准间',0.00,NULL,0),(4007,'标准间',0.00,NULL,0),(4008,'标准间',0.00,NULL,0),(4009,'标准间',0.00,NULL,0),(4010,'标准间',0.00,NULL,0),(5001,'大床房',0.00,NULL,0),(5002,'大床房',0.00,NULL,0),(5003,'大床房',0.00,NULL,0),(5004,'大床房',0.00,NULL,0),(5005,'大床房',0.00,NULL,0),(5006,'大床房',0.00,NULL,0),(5007,'大床房',0.00,NULL,0),(5008,'大床房',0.00,NULL,0),(5009,'大床房',0.00,NULL,0),(5010,'大床房',0.00,NULL,0);
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
INSERT INTO `settings` VALUES (2001,'off',10,26,10,'低','制冷','关',12.00,24.00),(2002,'off',15,26,15,'低','制冷','关',12.00,24.00),(2003,'off',18,26,18,'低','制热','关',12.00,24.00),(2004,'off',26,26,12,'低','制热','关',12.00,24.00),(2005,'off',26,26,14,'低','制热','关',12.00,24.00),(2006,'off',26,26,26,'低','制热','关',12.00,24.00),(2007,'off',26,26,26,'低','制热','关',12.00,24.00),(2008,'off',26,26,26,'低','制热','关',12.00,24.00),(2009,'off',26,26,26,'低','制热','关',12.00,24.00),(2010,'on',26,23,26,'中','制热','开',12.00,24.00),(3001,'off',26,26,26,'低','制热','关',12.00,24.00),(3002,'off',26,26,26,'低','制热','关',12.00,24.00),(3003,'off',26,26,26,'低','制热','关',12.00,24.00),(3004,'off',26,26,26,'低','制热','关',12.00,24.00),(3005,'off',26,26,26,'低','制热','关',12.00,24.00),(3006,'off',26,26,26,'低','制热','关',12.00,24.00),(3007,'off',26,26,26,'低','制热','关',12.00,24.00),(3008,'off',26,26,26,'低','制热','关',12.00,24.00),(3009,'off',26,26,26,'低','制热','关',12.00,24.00),(3010,'off',26,26,26,'低','制热','关',12.00,24.00),(4001,'off',26,26,26,'低','制热','关',12.00,24.00),(4002,'off',26,26,26,'低','制热','关',12.00,24.00),(4003,'off',26,26,26,'低','制热','关',12.00,24.00),(4004,'off',26,26,26,'低','制热','关',12.00,24.00),(4005,'off',26,26,26,'低','制热','关',12.00,24.00),(4006,'off',26,26,26,'低','制热','关',12.00,24.00),(4007,'off',26,26,26,'低','制热','关',12.00,24.00),(4008,'off',26,26,26,'低','制热','关',12.00,24.00),(4009,'off',26,26,26,'低','制热','关',12.00,24.00),(4010,'off',26,26,26,'低','制热','关',12.00,24.00),(5001,'off',26,26,26,'低','制热','关',12.00,24.00),(5002,'off',26,26,26,'低','制热','关',12.00,24.00),(5003,'off',26,26,26,'低','制热','关',12.00,24.00),(5004,'off',26,26,26,'低','制热','关',12.00,24.00),(5005,'off',26,26,26,'低','制热','关',12.00,24.00),(5006,'off',26,26,26,'低','制热','关',12.00,24.00),(5007,'off',26,26,26,'低','制热','关',12.00,24.00),(5008,'off',26,26,26,'低','制热','关',12.00,24.00),(5009,'off',26,26,26,'低','制热','关',12.00,24.00),(5010,'off',26,26,26,'低','制热','关',12.00,24.00);
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
INSERT INTO `settings_history` VALUES (60,101,'2024-10-03 17:37:28','isOn: true',5.00),(61,101,'2024-10-03 18:03:10','temperature: 24',5.00),(62,101,'2024-10-04 11:58:32','isOn: false',0.00),(63,101,'2024-10-04 12:17:59','isOn: true',5.00),(64,101,'2024-10-04 12:26:10','isOn: false',0.00),(65,101,'2024-10-04 12:35:41','isOn: true',5.00),(66,101,'2024-10-04 12:35:44','mode: forcedHeating',8.00),(67,101,'2024-10-05 17:21:12','isOn: false',0.00),(68,101,'2024-10-05 19:11:12','isOn: true',5.00),(69,101,'2024-10-05 19:12:18','isOn: false',0.00),(70,101,'2024-10-05 19:12:57','isOn: true',0.00),(71,101,'2024-10-05 19:13:04','mode: strongCooling',10.00),(74,101,'2024-10-08 09:24:05','isOn: false',5.00),(77,2002,'2024-11-27 08:30:49','power: on',8.00);
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

-- Dump completed on 2024-11-29 17:39:40
