pipeline {
    agent any

    environment {
        // For Windows Docker Desktop
        DOCKER_BUILDKIT = "0"  // Disables BuildKit for better Windows compatibility
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
        success {
            bat 'echo "Deployment successful!"'
        }
        failure {
            bat 'echo "Pipeline failed! Check logs."'
        }
        always {
            // Clean up unused containers/images
            bat 'docker system prune -f'
        }
    }
}