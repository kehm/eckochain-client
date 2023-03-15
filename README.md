# ECKO Blockchain Client
## A Hyperledger Fabric SDK embedded Node.js application

ECKO is a distributed blockchain data consortium for ecological resurvey datasets.  
This repository holds the source code for a Node.js REST application that uses the Fabric Node.js SDK to communicate with the ECKO Blockchain.

To run the application, you must first configure your environment variables. See the .env.example and docker-compose.yaml files for an example.  
The application connects to a Hyperledger Fabric blockchain, a PostgreSQL database, an email client and a single sign-on provider.  
Run `npm run start` (production) or `npm run start:dev` (development) to start the application, or use docker-compose to create an image.

This project is created by the University of Bergen (UiB), Norway, and is available under the Apache License, Version 2.0 (Apache-2.0).

Read more about ECKO: <https://ecko.uib.no>
