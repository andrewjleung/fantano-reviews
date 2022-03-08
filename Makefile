make:
	virtualenv .env && source .env/bin/activate && pip install -r requirements.txt

clean: 
	rm -rf *__pycache__ .env && rm -f pyvenv.cfg
