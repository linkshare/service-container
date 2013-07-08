unittest:
	export NODE_TEST_ENV=test && \
  ./node_modules/mocha/bin/mocha --reporter spec --recursive

coverage:
	./node_modules/jscoverage/bin/jscoverage lib lib-cov && \
  export NODE_TEST_ENV=coverage && \
  ./node_modules/mocha/bin/mocha --reporter html-cov --recursive > coverage.html

 .PHONY: unittest coverage