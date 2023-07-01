# lotteryapp

lotteryapp backend in Typescript Node & Mongo Rest API server featuring NestJS!

## Getting started

1. Install packages with `yarn install`
2. Create env file `cp .env.example .env`
   1. Configure mongo db URL (e.g. one pointing to Mongo Atlas)
3. Develop app `yarn start:dev` 

## What's Inside

- [dotenv environment variables](https://github.com/motdotla/dotenv#readme)
- [MongoDB/mongoose configuration](https://docs.nestjs.com/techniques/mongodb)
- [Passport authentication](https://docs.nestjs.com/techniques/authentication)
- [Validation with class-validator](https://docs.nestjs.com/techniques/validation)
- [Mailer](https://github.com/nest-modules/mailer)
- [Serve-static middleware](https://www.npmjs.com/package/@nest-middlewares/serve-static)
  - example files
    - [http://localhost:3001/public/swagger.png](http://localhost:3001/public/swagger.png)
    - [http://localhost:3001/public/tests.png](http://localhost:3001/public/tests.png)
- [Compression](https://docs.nestjs.com/techniques/compression)
- [Security with helmet](https://docs.nestjs.com/techniques/security)
- [Logging middleware (Bunyan)](https://docs.nestjs.com/techniques/logger)
- [Swagger documentation](https://docs.nestjs.com/recipes/swagger)
- [Access logs with Morgan interceptor](https://github.com/mentos1386/nest-morgan#readme)

### Authorization features with end-to-end tests:

![e2e Test output](public/tests.png?raw=true "swagger auth docs")

#### Features:
- user signup
- user activation
- user login
- user relogin
- password reset
- forgotten password

## Configuring swagger

![swagger auth docs](public/swagger.png?raw=true "swagger auth docs")


This project uses modular swagger configuration. Each feature has it's own swagger document.
Follow these steps to add new feature:

1. In feature folder create `feature.swagger.ts` file.
2. Call `setupSwaggerDocument` and export the returned function.
3. Register feature module in `feature.module.ts` by calling the exported function from step 2.
4. Access your document at `/docs/:featurePath`.

For a concrete example see the [auth](http://localhost:3001/docs/auth/) feature.

## More

This backend will play nicely with awesome [react-starter](https://github.com/Kamahl19/react-starter) create-react-app project written in Typescript!

## License
MIT


## Docker

docker build -t svijay1692/lotteryapp .      
docker run --name lotteryapp -p 80:3001 -d svijay1692/lotteryapp

# AWA Repository
{
    "repository": {
        "repositoryArn": "arn:aws:ecr:us-east-2:337623423716:repository/lotteryapp-staging",
        "registryId": "337623423716",
        "repositoryName": "lotteryapp-staging",
        "repositoryUri": "337623423716.dkr.ecr.us-east-2.amazonaws.com/lotteryapp-staging",
        "createdAt": "2023-01-09T20:36:46+05:30",
        "imageTagMutability": "MUTABLE",
        "imageScanningConfiguration": {
            "scanOnPush": false
        },
        "encryptionConfiguration": {
            "encryptionType": "AES256"
        }
    }
}

# AWA Token
{
    "family": "",
    "taskRoleArn": "",
    "executionRoleArn": "",
    "networkMode": "awsvpc",
    "containerDefinitions": [
        {
            "name": "",
            "image": "",
            "repositoryCredentials": {
                "credentialsParameter": ""
            },
            "cpu": 0,
            "memory": 0,
            "memoryReservation": 0,
            "links": [
                ""
            ],
            "portMappings": [
                {
                    "containerPort": 0,
                    "hostPort": 0,
                    "protocol": "udp"
                }
            ],
            "essential": true,
            "entryPoint": [
                ""
            ],
            "command": [
                ""
            ],
            "environment": [
                {
                    "name": "",
                    "value": ""
                }
            ],
            "environmentFiles": [
                {
                    "value": "",
                    "type": "s3"
                }
            ],
            "mountPoints": [
                {
                    "sourceVolume": "",
                    "containerPath": "",
                    "readOnly": true
                }
            ],
            "volumesFrom": [
                {
                    "sourceContainer": "",
                    "readOnly": true
                }
            ],
            "linuxParameters": {
                "capabilities": {
                    "add": [
                        ""
                    ],
                    "drop": [
                        ""
                    ]
                },
                "devices": [
                    {
                        "hostPath": "",
                        "containerPath": "",
                        "permissions": [
                            "mknod"
                        ]
                    }
                ],
                "initProcessEnabled": true,
                "sharedMemorySize": 0,
                "tmpfs": [
                    {
                        "containerPath": "",
                        "size": 0,
                        "mountOptions": [
                            ""
                        ]
                    }
                ],
                "maxSwap": 0,
                "swappiness": 0
            },
            "secrets": [
                {
                    "name": "",
                    "valueFrom": ""
                }
            ],
            "dependsOn": [
                {
                    "containerName": "",
                    "condition": "SUCCESS"
                }
            ],
            "startTimeout": 0,
            "stopTimeout": 0,
            "hostname": "",
            "user": "",
            "workingDirectory": "",
            "disableNetworking": true,
            "privileged": true,
            "readonlyRootFilesystem": true,
            "dnsServers": [
                ""
            ],
            "dnsSearchDomains": [
                ""
            ],
            "extraHosts": [
                {
                    "hostname": "",
                    "ipAddress": ""
                }
            ],
            "dockerSecurityOptions": [
                ""
            ],
            "interactive": true,
            "pseudoTerminal": true,
            "dockerLabels": {
                "KeyName": ""
            },
            "ulimits": [
                {
                    "name": "stack",
                    "softLimit": 0,
                    "hardLimit": 0
                }
            ],
            "logConfiguration": {
                "logDriver": "syslog",
                "options": {
                    "KeyName": ""
                },
                "secretOptions": [
                    {
                        "name": "",
                        "valueFrom": ""
                    }
                ]
            },
            "healthCheck": {
                "command": [
                    ""
                ],
                "interval": 0,
                "timeout": 0,
                "retries": 0,
                "startPeriod": 0
            },
            "systemControls": [
                {
                    "namespace": "",
                    "value": ""
                }
            ],
            "resourceRequirements": [
                {
                    "value": "",
                    "type": "InferenceAccelerator"
                }
            ],
            "firelensConfiguration": {
                "type": "fluentd",
                "options": {
                    "KeyName": ""
                }
            }
        }
    ],
    "volumes": [
        {
            "name": "",
            "host": {
                "sourcePath": ""
            },
            "dockerVolumeConfiguration": {
                "scope": "shared",
                "autoprovision": true,
                "driver": "",
                "driverOpts": {
                    "KeyName": ""
                },
                "labels": {
                    "KeyName": ""
                }
            },
            "efsVolumeConfiguration": {
                "fileSystemId": "",
                "rootDirectory": "",
                "transitEncryption": "DISABLED",
                "transitEncryptionPort": 0,
                "authorizationConfig": {
                    "accessPointId": "",
                    "iam": "DISABLED"
                }
            },
            "fsxWindowsFileServerVolumeConfiguration": {
                "fileSystemId": "",
                "rootDirectory": "",
                "authorizationConfig": {
                    "credentialsParameter": "",
                    "domain": ""
                }
            }
        }
    ],
    "placementConstraints": [
        {
            "type": "memberOf",
            "expression": ""
        }
    ],
    "requiresCompatibilities": [
        "FARGATE"
    ],
    "cpu": "",
    "memory": "",
    "tags": [
        {
            "key": "",
            "value": ""
        }
    ],
    "pidMode": "task",
    "ipcMode": "task",
    "proxyConfiguration": {
        "type": "APPMESH",
        "containerName": "",
        "properties": [
            {
                "name": "",
                "value": ""
            }
        ]
    },
    "inferenceAccelerators": [
        {
            "deviceName": "",
            "deviceType": ""
        }
    ],
    "ephemeralStorage": {
        "sizeInGiB": 0
    },
    "runtimePlatform": {
        "cpuArchitecture": "ARM64",
        "operatingSystemFamily": "WINDOWS_SERVER_2019_CORE"
    }
}




