@echo off
set FILTER_BRANCH_SQUELCH_WARNING=1
git filter-branch -f --env-filter "if [ \"$GIT_AUTHOR_NAME\" = \"Livia K C P Leite\" ] || [ \"$GIT_AUTHOR_EMAIL\" = \"478423@pmdc.local\" ] || [ \"$GIT_AUTHOR_EMAIL\" = \"contato.ribeirowellington@gmail.com\" ]; then export GIT_AUTHOR_NAME=\"Wellington Ribeiro - Analista de Dados\"; export GIT_AUTHOR_EMAIL=\"ouvidoria020@gmail.com\"; fi; if [ \"$GIT_COMMITTER_NAME\" = \"Livia K C P Leite\" ] || [ \"$GIT_COMMITTER_EMAIL\" = \"478423@pmdc.local\" ] || [ \"$GIT_COMMITTER_EMAIL\" = \"contato.ribeirowellington@gmail.com\" ]; then export GIT_COMMITTER_NAME=\"Wellington Ribeiro - Analista de Dados\"; export GIT_COMMITTER_EMAIL=\"ouvidoria020@gmail.com\"; fi" --tag-name-filter cat -- --branches --tags

