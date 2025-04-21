pipeline {
    agent any
    environment {
        // Force using Windows paths
        COMPOSE_CONVERT_WINDOWS_PATHS = "1"
    }
    stages {
        stage('Checkout') {
            steps {
                git branch: 'main',
                url: 'https://github.com/Jared-Pi/SkyStream.git'
            }
        }

        stage('Build') {
            steps {
                bat 'docker build -t skystream .'
            }
        }

        stage('Test') {
            steps {
                bat 'docker run --rm skystream npm test'
            }
        }

        stage('Deploy') {
            steps {
                bat 'docker-compose -f docker-compose.prod.yml up -d --build'
            }
        }
    }
    post {
        always {
            bat 'docker system prune -f'
        }
    }
}