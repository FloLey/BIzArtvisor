a chatbot that will be entirly configurable to use different models/RAG's/tools/agents/...


To run install docker-compose and run "docker-compose up"
you also need to add a .env file in the root of the folder with your API keys for the models:
OPENAI_API_KEY=xxxxxxxxxxxxxxxxxxxxxx
ANTHROPIC_API_KEY=xxxxxxxxxxxxxxxxxxx

Still work in progress: next steps are adding an easy way to change the model, add possibility to upload images, upload large fils to fill a vector db to create a rag, add agents with tools, ...
