pipeline {
  agent any
  stages {
    stage('Build') {
      steps {
        sh 'docker build -t SkyStream .'
      }
    }
    stage('Test') {
      steps {
        sh 'docker run SkyStream npm test'  // Replace with your test command
      }
    }
    stage('Deploy') {
      steps {
        sh 'docker-compose -f docker-compose.prod.yml up -d'
      }
    }
  }
}