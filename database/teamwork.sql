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

DROP TABLE IF EXISTS `rooms`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rooms` (
  `roomId` int NOT NULL,
  `customerName` varchar(45) DEFAULT NULL,
  `checkInTime` datetime DEFAULT NULL,
  `airConditionerFee` int DEFAULT '0',
  `checkedIn` tinyint NOT NULL DEFAULT '0',
  PRIMARY KEY (`roomId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rooms`
--

LOCK TABLES `rooms` WRITE;
/*!40000 ALTER TABLE `rooms` DISABLE KEYS */;
INSERT INTO `rooms` VALUES (101,'徐坤','2024-10-03 17:37:24',0,1),(102,NULL,NULL,0,0),(103,NULL,NULL,0,0),(104,NULL,NULL,0,0),(105,NULL,NULL,0,0),(106,NULL,NULL,0,0),(107,NULL,NULL,0,0),(108,NULL,NULL,0,0),(109,NULL,NULL,0,0),(110,NULL,NULL,0,0);
/*!40000 ALTER TABLE `rooms` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `settings`
--

DROP TABLE IF EXISTS `settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `settings` (
  `roomID` int NOT NULL,
  -- `isOn` tinyint DEFAULT '0',
  `roomTemperature` int DEFAULT '26',
  `power` enum('on', 'off') DEFAULT 'off',
  `temperature` int DEFAULT '26',
  `windSpeed` enum('高','中','低') DEFAULT '低',
  -- `mode` enum('energySaving','strongCooling','forcedHeating','custom') DEFAULT 'energySaving',
  `mode` enum('制冷','制热') DEFAULT '制冷',
  `sweep` enum('开', '关') DEFAULT '关',
  `cost` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `totalCost` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  PRIMARY KEY (`roomId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `settings`
--

LOCK TABLES `settings` WRITE;
/*!40000 ALTER TABLE `settings` DISABLE KEYS */;
INSERT INTO `settings` VALUES 
(101, 21, 'off', 26, '低', '制冷', '关', 11.00, 21.00),
(102, 22, 'off', 26, '低', '制冷', '关', 12.00, 22.00),
(103, 23, 'off', 26, '低', '制冷', '关', 13.00, 23.00),
(104, 24, 'off', 26, '低', '制冷', '关', 14.00, 24.00),
(105, 25, 'off', 26, '低', '制冷', '关', 15.00, 25.00),
(106, 26, 'off', 26, '低', '制冷', '关', 16.00, 26.00),
(107, 27, 'off', 26, '低', '制冷', '关', 17.00, 27.00),
(108, 28, 'off', 26, '低', '制冷', '关', 18.00, 28.00),
(109, 29, 'off', 26, '低', '制冷', '关', 19.00, 29.00),
(110, 30, 'off', 26, '低', '制冷', '关', 20.00, 30.00);

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
