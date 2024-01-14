FROM public.ecr.aws/lambda/nodejs:20

# Copy function code
COPY ./index.mjs ${LAMBDA_TASK_ROOT}

RUN npm install sodium-native

ENV NODE_ENV=production
  
# Set the CMD to your handler (could also be done as a parameter override outside of the Dockerfile)
CMD [ "index.handler" ]


# docker build --platform linux/arm64 -t docker-image:passkeys-api .
# docker run --platform linux/arm64 -p 9000:8080 docker-image:passkeys-api
# curl "http://localhost:9000/2015-03-31/functions/function/invocations" -d '{}'
# aws ecr get-login-password --region ap-southeast-2 | docker login --username AWS --password-stdin 427820939238.dkr.ecr.ap-southeast-2.amazonaws.com
# aws ecr create-repository --repository-name passkeys-api --region ap-southeast-2 --image-scanning-configuration scanOnPush=true --image-tag-mutability MUTABLE
# docker tag passkeys-api 427820939238.dkr.ecr.ap-southeast-2.amazonaws.com/passkeys-api:latest
# docker push 427820939238.dkr.ecr.ap-southeast-2.amazonaws.com/passkeys-api:latest

# aws lambda create-function --cli-input-json file://lambda/config.json