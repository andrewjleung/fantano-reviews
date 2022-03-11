make:
	python3 -m venv .env; \
	source .env/bin/activate; \
	pip install -r requirements.txt;

clean: 
	rm -rf __pycache__ .env && rm -f pyvenv.cfg
