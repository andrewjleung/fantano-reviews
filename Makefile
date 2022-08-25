make:
	cd generation; \
	python3 -m venv .venv; \
	. .venv/bin/activate; \
	pip install -r requirements.txt

clean: 
	cd generation && rm -rf __pycache__ .venv && rm -f pyvenv.cfg
