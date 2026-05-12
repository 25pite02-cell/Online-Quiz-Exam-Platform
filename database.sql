-- =============================================
-- QUIZ APPLICATION DATABASE
-- Import this file in phpMyAdmin
-- =============================================

CREATE DATABASE IF NOT EXISTS quiz_app;
USE quiz_app;

-- Users Table
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'user') DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Quizzes Table
CREATE TABLE quizzes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  time_limit INT NOT NULL COMMENT 'Time limit in minutes',
  created_by INT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  randomize_questions BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Questions Table
CREATE TABLE questions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  quiz_id INT NOT NULL,
  question_text TEXT NOT NULL,
  option_a VARCHAR(255) NOT NULL,
  option_b VARCHAR(255) NOT NULL,
  option_c VARCHAR(255) NOT NULL,
  option_d VARCHAR(255) NOT NULL,
  correct_answer ENUM('A', 'B', 'C', 'D') NOT NULL,
  marks INT DEFAULT 1,
  FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
);

-- Attempts Table
CREATE TABLE attempts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  quiz_id INT NOT NULL,
  score INT DEFAULT 0,
  total_marks INT DEFAULT 0,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  submitted_at TIMESTAMP NULL,
  time_taken INT COMMENT 'Time taken in seconds',
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (quiz_id) REFERENCES quizzes(id)
);

-- Answers Table (stores user answers per attempt)
CREATE TABLE attempt_answers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  attempt_id INT NOT NULL,
  question_id INT NOT NULL,
  selected_answer ENUM('A', 'B', 'C', 'D') NULL,
  is_correct BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (attempt_id) REFERENCES attempts(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES questions(id)
);

-- =============================================
-- SAMPLE DATA
-- =============================================

-- Default Admin User (password: admin123)
INSERT INTO users (username, email, password, role) VALUES
('admin', 'admin@quiz.com', '$2b$10$rOzJqf5oFVr6Yb6S9K1iveXPzGzOdFN0TKxkIH8Xp6Ty7PvLMTBsi', 'admin');

-- Sample regular user (password: user123)
INSERT INTO users (username, email, password, role) VALUES
('john_doe', 'john@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user');
