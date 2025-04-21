pipeline {
    agent any
    environment {
        DOCKER_HOST = "tcp://host.docker.internal:2375"
    }
    stages {
        stage('Checkout') {
            steps {
                git 'https://github.com/Jared-Pi/SkyStream.git'
            }
        }

        stage('Build') {
            steps {
                script {
                    docker.build("skystream:${env.BUILD_ID}", ".")
                }
            }
        }

        stage('Test') {
            steps {
                script {
                    docker.image("skystream:${env.BUILD_ID}").inside('-v /tmp:/tmp') {
                        dir('/app') {  // Match your WORKDIR in Dockerfile
                            sh 'npm test'
                        }
                    }
                }
            }
        }

        stage('Deploy') {
            steps {
                sh 'docker-compose -f docker-compose.prod.yml up -d --build'
            }
        }
    }

    post {
        always {
            sh 'docker system prune -f'
        }
    }
}