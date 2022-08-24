make:
	python3 -m venv .venv; \
	source .venv/bin/activate; \
	pip install -r requirements.txt

clean: 
	rm -rf __pycache__ .venv && rm -f pyvenv.cfg
