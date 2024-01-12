FROM public.ecr.aws/lambda/nodejs:20

# Copy function code
COPY ./index.js ${LAMBDA_TASK_ROOT}
  
# Set the CMD to your handler (could also be done as a parameter override outside of the Dockerfile)
CMD [ "index.handler" ]


# docker build --platform linux/arm64 -t docker-image:test .
# docker run --platform linux/arm64 -p 9000:8080 docker-image:test
# curl "http://localhost:9000/2015-03-31/functions/function/invocations" -d '{}'
# aws ecr get-login-password --region ap-southeast-2 | docker login --username AWS --password-stdin 427820939238.dkr.ecr.ap-southeast-2.amazonaws.com
# aws ecr create-repository --repository-name hello-world --region ap-southeast-2 --image-scanning-configuration scanOnPush=true --image-tag-mutability MUTABLE
# docker tag docker-image:test 427820939238.dkr.ecr.ap-southeast-2.amazonaws.com/hello-world:latest
# docker push 427820939238.dkr.ecr.ap-southeast-2.amazonaws.com/hello-world:latest

# aws lambda create-function --function-name hello-world --package-type Image --code ImageUri=427820939238.dkr.ecr.ap-southeast-2.amazonaws.com/hello-world:latest --architectures arm64 --role arn:aws:iam::427820939238:role/lambda-ex