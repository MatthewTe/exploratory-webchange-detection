FROM python:3.12.2-slim-bookworm

# Set the working directory in the container
WORKDIR /app

COPY requirements.txt .

RUN apt-get update \
    && apt-get -y install libpq-dev gcc git

RUN pip install -r requirements.txt

COPY main.py .

# Run FastAPI server when the container launches
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]