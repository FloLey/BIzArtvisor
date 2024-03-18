FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Set the Flask app environment variable
ENV FLASK_APP=server.py


COPY . /app

CMD ["python", "-m", "flask", "run", "--host=0.0.0.0"]
