import datetime
import os
import subprocess
from bs4 import BeautifulSoup
import sqlalchemy as sa
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from minio import Minio
import urllib3
import uvicorn
import uuid
import dotenv
import traceback
# psycopg2

app = FastAPI()

class WebsitSnapshot(BaseModel):
    id: str
    extracted_dt: str
    static_dir_root: str
    website: str

class SnapshotComparison(BaseModel):
    websiteName: str
    currentSnapshot: WebsitSnapshot
    previousSnapshot: WebsitSnapshot

class Comparison(BaseModel):
    id: uuid.UUID
    prev_snapshot: uuid.UUID
    new_snapshot: uuid.UUID
    unified_diff: str
    created_on: datetime.datetime
    

client = Minio(
    'local-minio:9000', 
    os.environ.get("MINIO_ROOT_USER"), 
    os.environ.get("MINIO_ROOT_PASSWORD"),
    secure=False
) 

postgres_conn_str: str = f"postgresql://{os.environ.get('POSTGRES_USER')}:{os.environ.get('POSTGRES_USER')}@local-postgres:5432/postgres"
postgresEngine: sa.Engine = sa.create_engine(postgres_conn_str)

def remove_html_content(html_content: str) -> str:
   
    soup = BeautifulSoup(html_content, "html.parser")
    
    for tag in soup.find_all(string=True):
        tag.extract()
    
    return str(soup.prettify())

@app.get("/")
async def hello_world():
    return {"hello": "World"}

@app.post("/test_s3_connection/")
async def test_minio_connections(comparison: SnapshotComparison):

    print(os.environ.get("MINIO_ROOT_USER"))
    print(os.environ.get("MINIO_ROOT_PASSWORD"))

    try:
        current_snapshot_response: urllib3.response.HTTPResponse  = client.get_object(
            "archives", 
            f"{comparison.currentSnapshot.static_dir_root}{comparison.websiteName}_content.html"
        )
        
        prev_snapshot_response: urllib3.response.HTTPResponse = client.get_object(
            "archives", 
            f"{comparison.previousSnapshot.static_dir_root}{comparison.websiteName}_content.html"
        )
        
        stripped_current_snapshot: str = remove_html_content(current_snapshot_response.data)
        stripped_prev_snapshot: str = remove_html_content(prev_snapshot_response.data)

        if not os.path.exists("./temp"):
            os.makedirs("./temp")

        temp_file_uuid = uuid.uuid4()

        # Writing html to temp dir to run the git diff:
        current_snapshot_path = f"./{temp_file_uuid}_curr_snapshot.html" 
        with open(current_snapshot_path, "w") as f:
            f.write(stripped_current_snapshot)
        
        prev_snapshot_path = f"./{temp_file_uuid}_prev_snapshot.html"
        with open(prev_snapshot_path, "w") as f:
            f.write(stripped_prev_snapshot)

        results = subprocess.run(
            ["git", "diff", "--no-index", 
                current_snapshot_path, 
                prev_snapshot_path 
            ], 
                stdout=subprocess.PIPE
            )
        
        unified_diff: str = results.stdout.decode()

        os.remove(current_snapshot_path)
        os.remove(prev_snapshot_path)

        comparison: Comparison = {
            "id": uuid.uuid4(),
            "prev_snapshot": comparison.previousSnapshot.id,
            "new_snapshot": comparison.currentSnapshot.id,
            "unified_diff": unified_diff,
            "created_on": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }

        return comparison

    except Exception as e:
        tb_str = traceback.format_exc()
        print(tb_str)
        raise HTTPException(status_code=500, detail=f"{str(e)}\n{tb_str}")


@app.post("/comparison/") 
async def create_snapshot_comparison(comparison: SnapshotComparison):

    '{"websiteName":"Destiny Reddit","currentSnapshot":{"id":"7d017cdc-e742-4ba4-9d2b-d1a50738a58e","extracted_dt":"2024-02-22T14:45:23.823Z","static_dir_root":"131370e0-94b3-430f-9331-e1569ad73d32/2024-02-22T06:45:23.823Z/","website":"131370e0-94b3-430f-9331-e1569ad73d32"},"previousSnapshot":{"id":"758468d0-79bf-4e07-80e5-11b7477d3e30","extracted_dt":"2024-02-22T14:43:25.080Z","static_dir_root":"131370e0-94b3-430f-9331-e1569ad73d32/2024-02-22T06:43:25.080Z/","website":"131370e0-94b3-430f-9331-e1569ad73d32"}}'

    # Grab the html content for both records and then call git diff:
    try:
        current_snapshot_response: urllib3.response.HTTPResponse  = client.get_object(
            "archives", 
            f"{comparison.currentSnapshot.static_dir_root}{comparison.websiteName}_content.html"
        )
        
        prev_snapshot_response: urllib3.response.HTTPResponse = client.get_object(
            "archives", 
            f"{comparison.previousSnapshot.static_dir_root}{comparison.websiteName}_content.html"
        )

        stripped_current_snapshot: str = remove_html_content(current_snapshot_response.data)
        stripped_prev_snapshot: str = remove_html_content(prev_snapshot_response.data)

        if not os.path.exists("./temp"):
            os.makedirs("./temp")

        temp_file_uuid = uuid.uuid4()

        # Writing html to temp dir to run the git diff:
        current_snapshot_path = f"./{temp_file_uuid}_curr_snapshot.html" 
        with open(current_snapshot_path, "w") as f:
            f.write(stripped_current_snapshot)
        
        prev_snapshot_path = f"./{temp_file_uuid}_prev_snapshot.html"
        with open(prev_snapshot_path, "w") as f:
            f.write(stripped_prev_snapshot)

        results = subprocess.run(
            ["git", "diff", "--no-index", 
                current_snapshot_path, 
                prev_snapshot_path 
            ], 
                stdout=subprocess.PIPE
            )
        
        unified_diff: str = results.stdout.decode()

        os.remove(current_snapshot_path)
        os.remove(prev_snapshot_path)

        comparison: Comparison = {
            "id": uuid.uuid4(),
            "prev_snapshot": comparison.previousSnapshot.id,
            "new_snapshot": comparison.currentSnapshot.id,
            "unified_diff": unified_diff,
            "created_on": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }

        with postgresEngine.connect() as conn, conn.begin():
            insertion_query: sa.Text = sa.text("""
                INSERT INTO comparison (id, prev_snapshot, new_snapshot, unified_diff, created_on)
                VALUES (:id, :prev_snapshot, :new_snapshot, :unified_diff, :created_on)
                RETURNING *
                """
            )

            postgres_result = conn.execute(insertion_query, parameters=comparison)
            inserted_comparison_tpl = postgres_result.fetchone()

            inserted_comparison: Comparison = Comparison(
                id=inserted_comparison_tpl[0],
                prev_snapshot=inserted_comparison_tpl[1],
                new_snapshot=inserted_comparison_tpl[2],
                unified_diff=inserted_comparison_tpl[3],
                created_on=inserted_comparison_tpl[4]
            )

            return inserted_comparison

    except Exception as e:
        tb_str = traceback.format_exc()
        print(tb_str)
        raise HTTPException(status_code=500, detail=f"{str(e)}\n{tb_str}")

    finally:
        current_snapshot_response.close()
        current_snapshot_response.release_conn()
        prev_snapshot_response.close()
        prev_snapshot_response.release_conn()

if __name__ == "__main__":
    uvicorn.run(app, host="localhost", port=8000)