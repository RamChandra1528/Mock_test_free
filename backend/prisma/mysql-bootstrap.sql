-- Run this once from an authenticated MySQL administrator session.
-- It creates a least-privilege local account compatible with Prisma's MySQL connector.

CREATE DATABASE IF NOT EXISTS mockmaster
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'mockmaster'@'localhost'
  IDENTIFIED WITH caching_sha2_password BY 'DevOnly_8x7Qp2Lm';

ALTER USER 'mockmaster'@'localhost'
  IDENTIFIED WITH caching_sha2_password BY 'DevOnly_8x7Qp2Lm'
  ACCOUNT UNLOCK;

GRANT ALL PRIVILEGES ON mockmaster.* TO 'mockmaster'@'localhost';
