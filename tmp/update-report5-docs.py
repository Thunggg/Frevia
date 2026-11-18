import json
from collections import Counter,defaultdict
from pathlib import Path
root=Path('docs/Report 5')
catalog=json.loads((root/'tools/nhuy-test-catalog.json').read_text(encoding='utf8'))
all_results=json.loads(Path('tmp/report5-all-results.json').read_text(encoding='utf8'))
modules=defaultdict(list)
for g in catalog['groups']:modules[g['module']].extend(g['cases'])
rows=[]
for module,cases in modules.items():
 counts=Counter(c['type'] for c in cases)
 rows.append(f"{module} & {len(cases)} & {counts['N']} & {counts['A']} & {counts['B']} \\\\ \\hline")
summary=r'''\subsection{Current Verification: Nhat Huy, 09 November 2026}
The extension covers all 51 use cases assigned to Nguyen Lu Nhat Huy across Sprints 1--5, using the current Report 3 requirements, Report 4 designs, backend service code, controller DTOs and shared Zod schemas.

\begin{itemize}
\item \textbf{Unit test matrices:} 57 methods, \texttt{UF-122} to \texttt{UF-178}, containing 582 cases. Each matrix belongs to one method; dependencies are mocked. DTO validation cases are distinguished from service logic cases.
\item \textbf{Executed unit tests:} all 582 added cases passed. The complete \texttt{test:unit} suite passed 1,358 cases across 34 suites. TypeScript checking completed successfully. This is a test execution result, not a measured statement-coverage percentage.
\item \textbf{System/API specifications:} 198 added cases across 16 \texttt{NH} worksheets in the system test workbook. All remain \textbf{Pending}. Dates and testers are intentionally blank until execution. Unit mocks do not establish browser, authentication, RBAC, database, storage, or third-party integration correctness.
\item \textbf{Existing material:} matrices \texttt{UF-01} to \texttt{UF-121} and the other members' system case rows are retained. Their original reported results are historical records; they were not inferred from the new cases.
\end{itemize}

\begin{table}[H]
\caption{Nhat Huy added unit case distribution}
\centering
\small
\begin{tabular}{|p{5.5cm}|r|r|r|r|}
\hline
\hd{Module} & \hd{Cases} & \hd{Normal} & \hd{Abnormal} & \hd{Boundary} \\ \hline
'''+ '\n'.join(rows)+r'''
\hline
\end{tabular}
\end{table}

\textbf{Implementation notes.} Role names in access checks are \texttt{Client}, \texttt{Freelancer}, \texttt{Admin}, and \texttt{Expert}; revision type enums use uppercase values. CV upload and replacement share one service method and one matrix. Administrator revision history is provided through the status-filterable administrator list; the account endpoint returns only the latest revision. Uploaded-file size errors raised by Multer are HTTP 413, while direct service validation exceptions can be HTTP 400. These layers must not be conflated.

\textbf{Evidence and reproduction.} The unit matrix and test source share a catalogue in \texttt{tools/nhuy-test-catalog.json}. The detailed mapping, commands, execution scope and pending verification are documented in \texttt{README-NHUY.md}. No production code was changed for this extension.

\subsection{Historical Results Reported on 04 November 2026}
The remaining tables and analysis below preserve the original report's baseline figures. They are not the execution totals of the 09 November extension and do not establish completion of the newly added system test specifications.
'''
(root/'nhuy-test-summary.tex').write_text(summary,encoding='utf8')
p=root/'Report5_Test_Documentation.tex';s=p.read_text(encoding='utf8')
s=s.replace('\\section{Test Reports}\n','\\section{Test Reports}\n\n\\input{nhuy-test-summary.tex}\n',1)
old=s.index('Based on the execution results of 507 unit test cases',s.index('\\subsection{Test Conclusion}'))
end=s.index('\n\\end{document}',old)
s=s[:old]+r'''On 09 November 2026, all 1,358 executable backend unit tests passed, including 582 added cases for Nhat Huy's 51 use cases. The new matrix specifications and 198 system/API scenarios are complete as test documentation. System/API execution remains pending; no release-readiness or full integration claim is made from the unit results. The earlier figures above are retained as the original project's historical report.
'''+s[end:]
p.write_text(s,encoding='utf8')
print('Updated TeX summary and conclusion')
