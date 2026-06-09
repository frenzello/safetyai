import { useState } from "react";
import { creaAzienda, accettaPrivacy, genId } from "./database";
import API_URL from "./config";

// ─── PDF BASE64 EMBEDDED ──────────────────────────────────────────────────────
const PDF_PRIVACY_B64 = "JVBERi0xLjQKJZOMi54gUmVwb3J0TGFiIEdlbmVyYXRlZCBQREYgZG9jdW1lbnQgKG9wZW5zb3VyY2UpCjEgMCBvYmoKPDwKL0YxIDIgMCBSIC9GMiAzIDAgUgo+PgplbmRvYmoKMiAwIG9iago8PAovQmFzZUZvbnQgL0hlbHZldGljYSAvRW5jb2RpbmcgL1dpbkFuc2lFbmNvZGluZyAvTmFtZSAvRjEgL1N1YnR5cGUgL1R5cGUxIC9UeXBlIC9Gb250Cj4+CmVuZG9iagozIDAgb2JqCjw8Ci9CYXNlRm9udCAvSGVsdmV0aWNhLUJvbGQgL0VuY29kaW5nIC9XaW5BbnNpRW5jb2RpbmcgL05hbWUgL0YyIC9TdWJ0eXBlIC9UeXBlMSAvVHlwZSAvRm9udAo+PgplbmRvYmoKNCAwIG9iago8PAovQ29udGVudHMgOSAwIFIgL01lZGlhQm94IFsgMCAwIDU5NS4yNzU2IDg0MS44ODk4IF0gL1BhcmVudCA4IDAgUiAvUmVzb3VyY2VzIDw8Ci9Gb250IDEgMCBSIC9Qcm9jU2V0IFsgL1BERiAvVGV4dCAvSW1hZ2VCIC9JbWFnZUMgL0ltYWdlSSBdCj4+IC9Sb3RhdGUgMCAvVHJhbnMgPDwKCj4+IAogIC9UeXBlIC9QYWdlCj4+CmVuZG9iago1IDAgb2JqCjw8Ci9Db250ZW50cyAxMCAwIFIgL01lZGlhQm94IFsgMCAwIDU5NS4yNzU2IDg0MS44ODk4IF0gL1BhcmVudCA4IDAgUiAvUmVzb3VyY2VzIDw8Ci9Gb250IDEgMCBSIC9Qcm9jU2V0IFsgL1BERiAvVGV4dCAvSW1hZ2VCIC9JbWFnZUMgL0ltYWdlSSBdCj4+IC9Sb3RhdGUgMCAvVHJhbnMgPDwKCj4+IAogIC9UeXBlIC9QYWdlCj4+CmVuZG9iago2IDAgb2JqCjw8Ci9QYWdlTW9kZSAvVXNlTm9uZSAvUGFnZXMgOCAwIFIgL1R5cGUgL0NhdGFsb2cKPj4KZW5kb2JqCjcgMCBvYmoKPDwKL0F1dGhvciAoXChhbm9ueW1vdXNcKSkgL0NyZWF0aW9uRGF0ZSAoRDoyMDI2MDUxNTEwMjk0NiswMCcwMCcpIC9DcmVhdG9yIChcKHVuc3BlY2lmaWVkXCkpIC9LZXl3b3JkcyAoKSAvTW9kRGF0ZSAoRDoyMDI2MDUxNTEwMjk0NiswMCcwMCcpIC9Qcm9kdWNlciAoUmVwb3J0TGFiIFBERiBMaWJyYXJ5IC0gXChvcGVuc291cmNlXCkpIAogIC9TdWJqZWN0IChcKHVuc3BlY2lmaWVkXCkpIC9UaXRsZSAoXChhbm9ueW1vdXNcKSkgL1RyYXBwZWQgL0ZhbHNlCj4+CmVuZG9iago4IDAgb2JqCjw8Ci9Db3VudCAyIC9LaWRzIFsgNCAwIFIgNSAwIFIgXSAvVHlwZSAvUGFnZXMKPj4KZW5kb2JqCjkgMCBvYmoKPDwKL0ZpbHRlciBbIC9BU0NJSTg1RGVjb2RlIC9GbGF0ZURlY29kZSBdIC9MZW5ndGggMTYyNAo+PgpzdHJlYW0KR2F1STY+QkFPVyY7QiQ3Lyt0UTw3dEQhOVNpPV1WTiZzVmtmUDUiWlVESmA8QlFRZV4rWHM4XFlPO0s/WXU0aUg5TzJqKWVxYXIsSShPYiFAKi1PLisqWG5rOGJAMHEtXlVANVRcNTNJXl1LdDxWaTA2aGJDamU4YFh0azxMXitXTCpfU2dRXyFgVkJyYypLW3E/OjRRTjpUIjlAVV9bQjYtK29ZWW0+dUhsP24xWEgtXyReOS8kWTJNLkk3OCZvXG50MyhkWS01P2xSYGVNITcyRGEnXTpZIS9LK29hUDZSSVFPRltta2pvdT82OmQncVBPP1RtZDhMIVdTZXJgIVxlbk89O1pddFJRUj4pKj8/b1I/JXM+KStySEFkJ1EzLzEyKVZDSzFiRF4pXVRSRVxNIzI6aEVgOiVXPE5WdGpkQj1BWEBoS2lEOjgwX2VvdDBoXVMsJSVHYDhNX2xLOD5cNDAqazxbbmMvMzYsdFRCQU9CQEFPbjBMXjBSc19lbTJsWVJROGRZV1smOkdXOiJsMFtGNSlyZGU7MkNuWTd0S1BOKGdsOiwwPHN1L1IrTloqRUNNYj8sIksmSFJBNzNWRDstQFFRXj9aIUtMaiQmI1xrNScmTzxlVG9LMDlxNiUiQDsoWSNlWzVuZENpZixqTy5hQV5VXy8rY2pOVT0lYSw0ampNaWY0TGtKN1ttIi9YW0dhIURRZzdBRkVXIWNWNTghZnJNY1lcREc0bkRxczcpKl0lKUxgR2BbInQ9L3U1am9QLDI/QjZQKEFuakRBVzdyWVlIO01BQUNnK2daTCcwXi8pLG4hRzRkb2ozXVU9NVg+MF9fdUAiQUhNVm1HJjViNFs8LXVmJ2MwNzJqK0QtKyhfPEsmOFpFK1deXFVfbk1rOlo9UTpTS1goIXVdPUUyRUY1X09jcSRER2MkSycxOUswS1FdLWxLREc4IWZzOFZdOHRIPjMkYj5xNTE6TVIrZT1WOGY+c19hOVhhR0U+ISReRFFNJk1PVWQ1cHUwSWBaTDs8TCclXTYpLmVrLVxJWWJhKkxTPkg7M0JBUU91NlBWU0hraENOZkhCVmgxLGI1MGwzXjtDdSsoakNybFonbSVTcWQ9IiM7RWRBOmw7N0hjIWk4X1EnYStTN0ZmUSooL2s0NkRydEJmKk1maWY8b2IlalFnVU5CMkRDKF9qLThKKF1vRmFMQlVDVkx1ZnApPmM+WltmKi43WE8mXlJVTjBbJlRHQ1c5LVVYYlshKEVQQS9OVDklT0tscENuKEFgNVBAM2xjcnNWb0sna25sdT8hITciYzYmKFBBJCpvPVxOIz5ZRlQpPyMmLGc+dCNHWkE+OlIpbFdVJXNqTzpKYm0tVlxRZ0w3NkdsW1dvQGhXSUVlPWc7bDpgXTpLNV4sIVEmciNraUVaRFY4UUM2T0BoNkVYTmtKZGsvJiVwRT1DUlZaN2otTm5YbV81Ukg+J0tUOzElUyMsL1ZObzowRzQ/NDNUMms5a0BCN1BwPDdZJFdWNj91OFRPSHJ1Sk9udGpJR1FZTXBrYj5yaTpeSy9xZFoyNy4/TmY+cmgqJz5TVTUsUzVtTSJCTSZgUzEiPVZZNzxxNixQJzlXJitkTUAzWShgIkpqbDZVPSFIJGRuTURbNkIucFVWOzdFLiIrbiFrUHFrRFUpLipET2tqYCZobSM/VGknTT5AQCU0Jzo9aDJuIyk+ITJVWyFpWV9AY0J1I1NJbyFJUUV1NTRBIm9VNFArcl43VjxSXTVVVWJhRkhhVmtTMy9kSChpKTU0OmktPm5LbWNYN3E8RmxKYiNJVFpsamgoJyxSbVApZlBpdDdjN3M8QmVhQilBRkxCYHUpY2MiTl1YQiU7NTEoKzFXY1o6TTNbYkRHXzRHTzs/J102KUFcMyhFLihYVEktU19ZT29dVD9BWUBNOTFERzAvVkQ3c2lBRmtzVShYOGRARV8oYCtaTV5jQmdxWkRFKCpIUHAvVWpoXChoYmUlQEhGLlEoTFFYPk5nWVpuW0VWcE9dRVFiaDRcQURXS10jPzNIRjUqJWgvbks3IWBgT0REPWVdJmc2U1wjQWdpUy0qNzU3OHVnckNXbCouOllNQyNtIy46WmghVEYxLTRZOSVyT2opYFg7YSJuc2kyU2N+PmVuZHN0cmVhbQplbmRvYmoKMTAgMCBvYmoKPDwKL0ZpbHRlciBbIC9BU0NJSTg1RGVjb2RlIC9GbGF0ZURlY29kZSBdIC9MZW5ndGggMTE0Nwo+PgpzdHJlYW0KR2F0VXE5bEpjRyY7S1pRJ20kRl44NkQjNkxPO2VNMiIyW3NBLnVGIj9XYF5zQWcqOj9NMD9CKG9mSnUvVXUnXFQhLzRnL09ALWIiR290SFMkRyhKcmYsX1o9J3RqTGRKST5Sc0pQLj11RlRZXkdnIyJVYidQVEQpWyxxdXBfLSVwUjojaTFBJCpKQkhKSSpWPUtgRy5vVVNXTzhSRi5RJj1bblpNXzVgdShNWSdZKTNpUz87WCw4RDtYMDQzYV9UIyZ1XiU0dGYhVElNLWNBYScjaDgja0olbiNRYzUpN206bXBTQW9baVJeQ2YlMm40aT5iJjs/YHFfSkc2PjNqWExCZTAwVWVaUGtnIVQvKFRgKFw0QGsuM1o7QV0uPVYtIidEMlhERk51JSduRUpsXi5mIS0jTz1JNiNmKyQwJFAick1Qay9kPTkuXzJuOXRbTFAzdTlmYiNfYz9UYjknXkswRFosSzUlJ1ReMiNPaUYyTlBCTDl0YjdhUF9pVVYvWz0oIXMrMmNBOGNUVmolPktKJSg9VSghPmpEOztdJy1VIyohVVt0OVJHbWxcKy9sSDBkNSRtcnFZdUlib0ZDPiFbYEIjPCtpO1M8JVtMX2pGWSE6XnVaLDZqUXJfTCtTQF9dJlMvIVZaTHJCQ2Y4V3QsNkwjRzY2SzY1VzlAWmRMKnNJY1AhajZOQWJxKUhCKzZYcjJXJiFALS0vaXUxTktmZ1drJVdILyQyV2lEKDdxLjNHTT44M09xY2RmWmxjQSQ6U202MidjQDZoXiFfMFkqYlBFU2Q8WV1XWyZLXXRjJCxnLEk2ZUFPIThBMDNPTkc3SDI7WCVzaFhja0pnMzc/ciNtMFo3ZDU+YU1gPWZMIkpOJmJARVQjYyUiT1RqI0JVQUFIYEwmPGplSGlzOmVEIT06QGBxalxvLWNtRi1TRjowVVhUZEF1YWpnYnMucT5cPUdTbiI2JGgnUmYtYSJeYnIrNUA4J3BOR2xeXCcqbjBsb11MUWMuJ0pcSCl0XjVLcjJ1JVZPaWQqUjpGSFJeYk5II2UtPUJuSUtjRTswOjhvbDhPLTpUJWZPL2JWa0lVcEJlVHJaUWZBZlNiKF1YZHIwOWVbSUw4WVlOKik7a2ZCQzU7JldaYzovKCY6UWNxdFxURyxpJyM4c0FWSGQsY25sS3FKbHU3PkdhODsvK0prUEpBRm9gXXVgOT1jbG4uRkRVX2tscGkpLWpDImkzT2deMF5xKlljN11iQlVPOj9FQUpMS0FeSS8nLy4kYlhwOG8tKFkzOnBLLjRpNSVAVGhLaSgpU0YmPFs4U2hnKkpHTG5YQ0JCVlRRLlw4MWFxSW5qZVVxUkY3RUg6YEpeK1B1WmE+ZDA3amFtb2lGPS9IJzhQXTdVTkJGXk9BXW1LSWJVY2w4XFE1XG0pamhgQCNIV1Y7WWwpZVVnT1xlY1wjSkRvKW9mUDBsLUZRZ3E7XUg0V1N1LFskcElybyRlSz0pPVdGR2pFTkpxRyFtTFdJMUZYbHB+PmVuZHN0cmVhbQplbmRvYmoKeHJlZgowIDExCjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDA2MSAwMDAwMCBuIAowMDAwMDAwMTAyIDAwMDAwIG4gCjAwMDAwMDAyMDkgMDAwMDAgbiAKMDAwMDAwMDMyMSAwMDAwMCBuIAowMDAwMDAwNTI0IDAwMDAwIG4gCjAwMDAwMDA3MjggMDAwMDAgbiAKMDAwMDAwMDc5NiAwMDAwMCBuIAowMDAwMDAxMDc2IDAwMDAwIG4gCjAwMDAwMDExNDEgMDAwMDAgbiAKMDAwMDAwMjg1NiAwMDAwMCBuIAp0cmFpbGVyCjw8Ci9JRCAKWzw5ZmNmOGVmM2UzZGM1YzQwYzVkOTc2YjgyMGE5YzUxND48OWZjZjhlZjNlM2RjNWM0MGM1ZDk3NmI4MjBhOWM1MTQ+XQolIFJlcG9ydExhYiBnZW5lcmF0ZWQgUERGIGRvY3VtZW50IC0tIGRpZ2VzdCAob3BlbnNvdXJjZSkKCi9JbmZvIDcgMCBSCi9Sb290IDYgMCBSCi9TaXplIDExCj4+CnN0YXJ0eHJlZgo0MDk1CiUlRU9GCg==";
const PDF_DPA_B64 = "JVBERi0xLjQKJZOMi54gUmVwb3J0TGFiIEdlbmVyYXRlZCBQREYgZG9jdW1lbnQgKG9wZW5zb3VyY2UpCjEgMCBvYmoKPDwKL0YxIDIgMCBSIC9GMiAzIDAgUgo+PgplbmRvYmoKMiAwIG9iago8PAovQmFzZUZvbnQgL0hlbHZldGljYSAvRW5jb2RpbmcgL1dpbkFuc2lFbmNvZGluZyAvTmFtZSAvRjEgL1N1YnR5cGUgL1R5cGUxIC9UeXBlIC9Gb250Cj4+CmVuZG9iagozIDAgb2JqCjw8Ci9CYXNlRm9udCAvSGVsdmV0aWNhLUJvbGQgL0VuY29kaW5nIC9XaW5BbnNpRW5jb2RpbmcgL05hbWUgL0YyIC9TdWJ0eXBlIC9UeXBlMSAvVHlwZSAvRm9udAo+PgplbmRvYmoKNCAwIG9iago8PAovQ29udGVudHMgOSAwIFIgL01lZGlhQm94IFsgMCAwIDU5NS4yNzU2IDg0MS44ODk4IF0gL1BhcmVudCA4IDAgUiAvUmVzb3VyY2VzIDw8Ci9Gb250IDEgMCBSIC9Qcm9jU2V0IFsgL1BERiAvVGV4dCAvSW1hZ2VCIC9JbWFnZUMgL0ltYWdlSSBdCj4+IC9Sb3RhdGUgMCAvVHJhbnMgPDwKCj4+IAogIC9UeXBlIC9QYWdlCj4+CmVuZG9iago1IDAgb2JqCjw8Ci9Db250ZW50cyAxMCAwIFIgL01lZGlhQm94IFsgMCAwIDU5NS4yNzU2IDg0MS44ODk4IF0gL1BhcmVudCA4IDAgUiAvUmVzb3VyY2VzIDw8Ci9Gb250IDEgMCBSIC9Qcm9jU2V0IFsgL1BERiAvVGV4dCAvSW1hZ2VCIC9JbWFnZUMgL0ltYWdlSSBdCj4+IC9Sb3RhdGUgMCAvVHJhbnMgPDwKCj4+IAogIC9UeXBlIC9QYWdlCj4+CmVuZG9iago2IDAgb2JqCjw8Ci9QYWdlTW9kZSAvVXNlTm9uZSAvUGFnZXMgOCAwIFIgL1R5cGUgL0NhdGFsb2cKPj4KZW5kb2JqCjcgMCBvYmoKPDwKL0F1dGhvciAoXChhbm9ueW1vdXNcKSkgL0NyZWF0aW9uRGF0ZSAoRDoyMDI2MDUxNTEwMjk0NyswMCcwMCcpIC9DcmVhdG9yIChcKHVuc3BlY2lmaWVkXCkpIC9LZXl3b3JkcyAoKSAvTW9kRGF0ZSAoRDoyMDI2MDUxNTEwMjk0NyswMCcwMCcpIC9Qcm9kdWNlciAoUmVwb3J0TGFiIFBERiBMaWJyYXJ5IC0gXChvcGVuc291cmNlXCkpIAogIC9TdWJqZWN0IChcKHVuc3BlY2lmaWVkXCkpIC9UaXRsZSAoXChhbm9ueW1vdXNcKSkgL1RyYXBwZWQgL0ZhbHNlCj4+CmVuZG9iago4IDAgb2JqCjw8Ci9Db3VudCAyIC9LaWRzIFsgNCAwIFIgNSAwIFIgXSAvVHlwZSAvUGFnZXMKPj4KZW5kb2JqCjkgMCBvYmoKPDwKL0ZpbHRlciBbIC9BU0NJSTg1RGVjb2RlIC9GbGF0ZURlY29kZSBdIC9MZW5ndGggMTc2MAo+PgpzdHJlYW0KR2F1MEQ5aUtlOyZBQHNCb1BKI3AuJThQXUYpdWw5aEZcJ2ljQ1REJGpLW3IkOGBOPmRaSEtIL21aQih0Smk/O2U7QT5AUzgrcTtjbitERz1xIixmZGhsSGcmXTdlZikiOiw9VyU+YEA9QEpMcnNRXWonOVlzNFlwPzVnai5LSSQtJTIiRiNGRHQ8LzMiI0I2UkkkbzRHLF1UMyUtWTNvWyFrXVk8OylqOEU0LyI7Qio9aHFjSmhUXywuOlxJJiZMO29UQGhENidyYy9HcShVTjMzREpoXDE/UzMsY2xSUz8uaC1PRTpcQGMuPl9YX1ZJclhRLi4yXDpPOTdrYjtNM1E+R1Y3Nzd0WzZLVXIxVStsLzlsJCF0NU1pbSFFPmF1ZVIwX09FYmw3Z01oYlomP1tGZCdfSztWJWo3UWUmclUsP3VYVEUyMEpmUFVdMSphWitpU0FOYywoaCEyIUhULmBNLCwoOk9bZHVJPytvOGNoLWUqL1lcIWwhK09UK2BrUEEhb2FDOW8wRnBrdE9OPyNpJmBcOShyVnFLVjlPKjVzUilEPTwuOzcsazMnRWFaNVtcMy9rRU5fcF1aTkJsQmk3RV8mdTI6XXBxbS0/LFk7PVExUW8mal8wJ0RSSG43Jj1yaC1MWztqTnI1TkdFRTp0Llo+J1BIVEZCZDdrZlFWUWFMVzlHK2ViLjRQW0NYN1w7YF0hKDpbKjkwJGFuQ1VocUBvOVo/bSRBPSpMTj5ZaV5vNVxyPilRQT5ZVW9hVEpaZTxNZEEwRCNAZ1MyTVdzY1NkRlBgWDM9JmIyOTNBPCQ0UDlDZyhBKk9rNG5fTTNrYl4zOCM0QEtfOVghblhyWE5waVJWK0RcQkQtVmJlU1s7NGRRRy41a2lkTFNGYlhmaEtgMD0ybitFQSI8TnNyKl02MXNNPS8vLSMqPnFmay1fPVs8cl03bjUuTF4oSy0lKitVNDVgNCpYRCYsWDZWPFRDNCghOTFfaTlrIio0QEhIQjFISjE/YHInJV5gOFpvXFkyWUNZIidZKUZmV1lWKkomcCk0NlkiZDJtZm8yPEo9YTZaaGpXTSFdQV8sJGU/QlEnZHM/Rk1fYEsxN2AzZEIyZU03Y0ptSj1aIitPOi5iJiotXSFEYUxmJFlITjYqRD9PJXQjRnQrcixnNzE4SSFlRTFvYFQvc2dpJmpPMDpeVFphR2Q5aWtyXGwzVjQ9Vk9VVWpYcFcpL1Y6NlkyYWMlal1cdGpYP0RUMyxATSc7XiYnQixkXU4vaj5lJSZWajM7OVUjZUFqMysmVThuT0xNTWw1TC5QaTlyXiloZi9vTypYa3IhaUJWO3JRO0FWakBUZkFiWXRNYzJuRy9FKFU9J3JbM1NRa19taCM0MVE9Ym1UWmYpNFs+XEtAXFA5VEZbaDctNzZiRm0oWUJMcz5TMnRIInA7WEc8OmJTR3BoJ2E2Ll1QbV9tQVRZLUJMdChGXSVZSFpCXnJwRz8pdDZ1XiIjXGwxNmpMRDs7Xlpoa24jVWkxYnRKJTA9NFFUSTo7MUtMQzckSkFwaWtab1xVK0s8XjxkclkrOTpZcXBuJUooWT9vbmw0XytNa1BOQm5XLFZwbjRxN2ZlMGxHVl5wQi90VTpKNnA2YmlqcHNUW2VtZytUZ24/THQxX2lwak5iMCNXWGsnNzcxP09bMCZhTSlbYTdHZz1bUmtqaXVmWG8pL1dDLVw4YD4uXTZxYW9qQmZRYTJXRmRsMmI9OjFQXDxlXmQtPHBPTFxpRmpASS0vIVw5Qlhfa0lJIzhxTSdDK2NTJWE1ZmYpKWEwO0xnKjYqM2ZSZ24mcVszX19qMFIlYGpJWChLcSc2QDxjWEdcNUlVMlhXVUlvME9PczNaWWoxOyVkcz5WVzBnXiokXmgyRGRERzVydFlKPCRdPE1fLGxOKDQidVFSVT1PQENrM2M3Qlp1azhmVG8qT3BhVmBfW202L11rUiU7KDxnTi5FNWtKXzdbcT9BalQuVllGL21uXUkjPztZRWFGUm9pPlxBTyEhVDF0XlVKaDwvWD0jIlpiXiJfSDxRJ10xL0FBVypFYSEkaEwtQkYoMXJqNDVsLllySWVtMWYmQUk3R2Q8ZUc/X2IrQEZ0Q1QiWSNcPl9YQDNqaUdNLVxycSMuK01UYl9hRStncWVEL2lhaStlJCMrbW1HRlRsQ1JxLjc9X281c1RDTWZpJVRSR0AyK2hgcW91cj1KPCxSbTs6XGlpUF9RPjEmVnIxbDQ/Qi80cGdHTSRROkooRzRVJTg4Wi1aR3JgVSsiSS5lZ24lcSNAUzNzLl1bTUkmbU1pX29pRXIhLTIvQC49fj5lbmRzdHJlYW0KZW5kb2JqCjEwIDAgb2JqCjw8Ci9GaWx0ZXIgWyAvQVNDSUk4NURlY29kZSAvRmxhdGVEZWNvZGUgXSAvTGVuZ3RoIDE1NzYKPj4Kc3RyZWFtCkdhdTBDOWxvJkknWU88RV1OXk9vYXE0SU5ha1lBbWMoc0JDPlh1b1goUjBTYEY9OUJUOE4kMUVtbGpRV0EyZnRIXmxDcG45UzI/bl4zdG8wNXIhZ1ZwZyo/RUlUazQkP05jND1lZiw2KVBnVD5yaFFGJUc/XSFnYzY6UmY5LCw2P0NVR3Rna1kvQktQJlwwRz03N2ooTkVDKk1QJENNWGlbb14qJmwhZG5gZHM8cjosN2AmQHEkR0M5UCwrYWQ6Iz1DbzdYKVBDYF9gZFJYa1FsPihoYExsPFMraEoqLUtPZmcxJCcjPE47bidsITpAJlZWXD9vKyNMQSFEWFMjYE8xUUUrb1JiWURkSj0ocG5jc1dYNzQoX0UtTSdOP0ZUOVxQNFhiSCJCLGFSRkQ0X0E9PyJgWlc0dCtqZnBDP3JQKVgiNXI8WlJdM3JDbF47TidwZidwMj9PaDxIXkQ2RElWWj4hRyVLKEUlQD07JzVmUEhPXWxlcjY1Y2AoSGxsM09KYDYoIzJdR1tHM1onZGthYT4yMi9DKExPVF8haXJnXjBhRTc3LDkpTzBqZVVnP2w8Oigka2pFOmkwaUVCPi1eYTFOXHFuPlNkNEUsKCJvW0N1I1NcSVNFbDlLKlAobnJZYEc6QlNUbzRTTiJBRyVGIkAqRyw/NG86YzVFRUVIVmhJWnM4cDdxX1FwPWZkVmhEUk46OmI1N0ojY251dWIsSERlRV1CRTZ1SVtLYVpzTkBSJSRSWTx0X2RRQy9VUmx1ZTAiY0tuKCo4U0AmV25WMkBLWFp1N0Q1YEQuQkBvQyQrLylrKXBMIiJfQlkzQGs3LnRhYlcvKzhhQlAlJ2YsYlYuJG1lT202WDFLL05sVm1bUzBqI3UwXXE7IT8vc0UrVFtmUFZfNzdaV14wSCxcTlxkXkJuSFE2UzZCXEthYCpvTTI+S21tJ0w4Il0jJFMiJi5tXD9nIVtnZidJKyY5MGpSKSxmYVBDUFU5KG5AJTRvPCRQbFdvOClAKFQ/S1RecmxkZjI+a0U0XWJBImQ6cmlTXz9ZRDEnaGtmRXEyVUpwWFNwVFw+bCw6SDI3XiM8OCRYMEpRNTRlYCI0MFF0PnBMTVs2TWlFOEVjKDM2KTo+Ui9wbzVZLj90S25aRD05PSZrdGkwYyw0LTg/dFYqI00lIj45JCE8RHRZYjZpSFhJb2EhOHEzKW9pUVdRalNIOFZeUyk8KjpxZGZec1NjXDFML2Nub2cqKjs2OjVxKDJfWUUiWSYhM2leXWh1X3I7ZiIqIiVKVj9hKnFeVkI/KG0sJVhONXIvRyJjWGNVO2U3XlBMKEwySzQlcl1iTm03bW9BMkNLPjNJKlhqNTxGLFBAT3EoIzpDSy80TW1sUkA0XitnQXBBZVRnS186QF05ZmVjOzZBTVpBITolXD9lOUlyJDlxPFlEcF1sVlU6YU5PWGxFaCQyLDc2Z0clPiZWXEw2XDlKYW0hXyVfT1FzJF9QQFt0XmA1X1AlODM5USMrLmVuMipoRSgnRkEnSVY0L1gwQDtgZ0R0KVBLIm1eNFpEOzBgMTY4YyI/O0ZNSC9NTzs1P0JAa2hxIjNKPXItQipDVitjYzpVKzM8PGdjaF9ubU0hMFtHQGVaNEczQ1tuQDRQJUE6SjJjXiFfaS9VaSFub0BvNCdMLDVYP2s7KEY+WSMiaHA2OWBFPVw9VlpqbWFPL0EpKXIsaVxMbnNcR2RNX15EVGV1VGc6Tlg5JSpgXztFJStyP0tYSzQ2Wj5DMFdvXEswbjA/Z0YxcnU5Y0FKUWloYSc7QyJhKUBtI28nUWlDdGVyKVxkJk45a3Rka1w9ZGBXQGhKMUUjZGU7RicuP0hyTVhsUz5GMUNXNCtfKFkwcVIxXi5NbCRqXS1tVFlLOmNfaiZcX3AmdWxkRXMwQTRgMWEkX1NsJTZOZGhpYCw+W08oW1Vxc1ZIWXM4cSxMJWtXOF9vXkViYGUwNm1DcVY6MltgKTlLJSZlWDAoIUIiV15CZ2RYTDcrVTNKZmtTKGFUYC4+XF11KlhML11QXVd0OCZVZiViMUlBZz03NVtbLXEiW0VPa2l1TTckbkQjfj5lbmRzdHJlYW0KZW5kb2JqCnhyZWYKMCAxMQowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwNjEgMDAwMDAgbiAKMDAwMDAwMDEwMiAwMDAwMCBuIAowMDAwMDAwMjA5IDAwMDAwIG4gCjAwMDAwMDAzMjEgMDAwMDAgbiAKMDAwMDAwMDUyNCAwMDAwMCBuIAowMDAwMDAwNzI4IDAwMDAwIG4gCjAwMDAwMDA3OTYgMDAwMDAgbiAKMDAwMDAwMTA3NiAwMDAwMCBuIAowMDAwMDAxMTQxIDAwMDAwIG4gCjAwMDAwMDI5OTIgMDAwMDAgbiAKdHJhaWxlcgo8PAovSUQgCls8OGE1NGIwYzVhYjE2OTVkNDFhMWU2YzIyNDQ4YWNlNDM+PDhhNTRiMGM1YWIxNjk1ZDQxYTFlNmMyMjQ0OGFjZTQzPl0KJSBSZXBvcnRMYWIgZ2VuZXJhdGVkIFBERiBkb2N1bWVudCAtLSBkaWdlc3QgKG9wZW5zb3VyY2UpCgovSW5mbyA3IDAgUgovUm9vdCA2IDAgUgovU2l6ZSAxMQo+PgpzdGFydHhyZWYKNDY2MAolJUVPRgo=";

function scaricaPDF(b64, nomeFile) {
  const byteChars = atob(b64);
  const byteArr = new Uint8Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) byteArr[i] = byteChars.charCodeAt(i);
  const blob = new Blob([byteArr], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = nomeFile; a.click();
  URL.revokeObjectURL(url);
}

function apriPDFInTab(b64) {
  const byteChars = atob(b64);
  const byteArr = new Uint8Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) byteArr[i] = byteChars.charCodeAt(i);
  const blob = new Blob([byteArr], { type: "application/pdf" });
  window.open(URL.createObjectURL(blob), "_blank");
}


// ─── MODALE DOCUMENTO LEGALE ──────────────────────────────────────────────────
function ModaleDocumento({ tipo, onChiudi }) {
  const isPrivacy = tipo === "privacy";

  const RIASSUNTI = {
    privacy: {
      titolo: "Informativa Privacy",
      colore: "#3b82f6",
      icona: "🔒",
      intro: "Questo documento spiega come SafetyAI tratta i dati personali che carichi, in conformità al GDPR.",
      punti: [
        { titolo: "Chi è il Titolare", testo: "Sei tu — il professionista che usa SafetyAI. SafetyAI è il Responsabile che elabora i dati per conto tuo." },
        { titolo: "Quali dati trattiamo", testo: "Nomi e codici fiscali dei lavoratori, attestati di formazione, idoneità sanitarie, dati aziendali. Le idoneità sanitarie sono dati sensibili ex art. 9 GDPR." },
        { titolo: "Come li trattiamo", testo: "I file originali non vengono mai archiviati. Vengono analizzati in memoria dall'AI e immediatamente scartati. I dati estratti rimangono solo sul tuo dispositivo." },
        { titolo: "Chi li vede", testo: "Solo Anthropic (il motore AI) li elabora momentaneamente, senza conservarli e senza usarli per addestrare modelli. Nessun altro." },
        { titolo: "I tuoi diritti", testo: "I lavoratori possono esercitare diritti di accesso, rettifica e cancellazione. Le richieste vanno gestite da te, in quanto Titolare." },
      ],
    },
    dpa: {
      titolo: "Data Processing Agreement",
      colore: "#a78bfa",
      icona: "📄",
      intro: "Il DPA è il contratto obbligatorio tra te (Titolare) e SafetyAI (Responsabile) richiesto dall'art. 28 GDPR quando affidi dati personali a uno strumento esterno.",
      punti: [
        { titolo: "Perché esiste", testo: "Il GDPR obbliga a formalizzare per iscritto chi può fare cosa con i dati. Senza questo contratto non potresti legittimamente usare SafetyAI per trattare dati di terzi." },
        { titolo: "Cosa garantisce SafetyAI", testo: "Nessun uso dei dati per finalità proprie, nessuna cessione a terzi, notifica entro 72h in caso di violazione, supporto per le richieste degli interessati." },
        { titolo: "I sub-responsabili", testo: "Anthropic è nominato sub-responsabile. Riceve i dati solo per l'analisi AI e non li conserva né li usa per addestrare modelli." },
        { titolo: "Trasferimento USA", testo: "Anthropic ha sede negli USA. Il trasferimento avviene con le garanzie richieste dal Capo V GDPR." },
        { titolo: "Cosa fare", testo: "Accettando questo DPA formalizzi il rapporto contrattuale. Per uso professionale continuativo è consigliabile una revisione legale." },
      ],
    },
  };

  const doc = RIASSUNTI[tipo];

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "#000000cc" }}>
      <div style={{
        background: "#161b27", border: "1px solid #1e2535",
        borderRadius: 16, width: "100%", maxWidth: 600,
        maxHeight: "85vh", display: "flex", flexDirection: "column",
        overflow: "hidden", boxShadow: "0 24px 60px #00000080",
      }}>
        {/* Header modale */}
        <div style={{ padding: "18px 24px", borderBottom: "1px solid #1e2535", display: "flex", alignItems: "center", gap: 12, background: `${doc.colore}10` }}>
          <span style={{ fontSize: 20 }}>{doc.icona}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#f1f5f9" }}>{doc.titolo}</div>
            <div style={{ fontSize: 11, color: "#475569", marginTop: 1 }}>Documento completo disponibile per il download</div>
          </div>
          <button onClick={onChiudi} style={{ background: "none", border: "none", color: "#475569", fontSize: 20, cursor: "pointer", padding: "0 4px", lineHeight: 1 }}>✕</button>
        </div>

        {/* Corpo scrollabile */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
          {/* Intro */}
          <div style={{ padding: "12px 16px", background: `${doc.colore}12`, border: `1px solid ${doc.colore}25`, borderRadius: 8, fontSize: 13, color: "#94a3b8", lineHeight: 1.6, marginBottom: 20 }}>
            {doc.intro}
          </div>

          {/* Punti salienti */}
          <div style={{ fontSize: 11, color: "#475569", fontWeight: 700, letterSpacing: "0.5px", marginBottom: 12 }}>PUNTI SALIENTI</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
            {doc.punti.map((p, i) => (
              <div key={i} style={{ background: "#0f1117", borderRadius: 8, padding: "12px 14px", display: "flex", gap: 12 }}>
                <div style={{ width: 22, height: 22, borderRadius: 6, background: `${doc.colore}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: doc.colore, flexShrink: 0 }}>{i + 1}</div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#cbd5e1", marginBottom: 3 }}>{p.titolo}</div>
                  <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.6 }}>{p.testo}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Download */}
          <div style={{ background: "#0f1117", border: "1px solid #1e2535", borderRadius: 10, padding: "16px 18px" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#f1f5f9", marginBottom: 4 }}>Documento completo</div>
            <div style={{ fontSize: 11, color: "#475569", marginBottom: 12 }}>
              Il documento integrale in formato PDF, stampabile e archiviabile.
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => apriPDFInTab(isPrivacy ? PDF_PRIVACY_B64 : PDF_DPA_B64)}
                style={{ flex: 1, padding: "9px 14px", background: "#1e2535", border: "1px solid #334155", borderRadius: 8, color: "#94a3b8", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                👁 Apri nel browser
              </button>
              <button
                onClick={() => scaricaPDF(isPrivacy ? PDF_PRIVACY_B64 : PDF_DPA_B64, isPrivacy ? "SafetyAI_Informativa_Privacy.pdf" : "SafetyAI_DPA.pdf")}
                style={{ flex: 1, padding: "9px 14px", background: `${doc.colore}20`, border: `1px solid ${doc.colore}40`, borderRadius: 8, color: doc.colore, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                ↓ Scarica PDF
              </button>
            </div>
          </div>
        </div>

        {/* Footer modale */}
        <div style={{ padding: "14px 24px", borderTop: "1px solid #1e2535" }}>
          <button
            onClick={onChiudi}
            style={{ width: "100%", padding: "11px", background: "linear-gradient(135deg, #3b82f6, #06b6d4)", border: "none", borderRadius: 9, color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
            Ho letto, chiudi
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── SCHERMATA BENVENUTO ──────────────────────────────────────────────────────
function SchermataBenvenuto({ onAccetta }) {
  const [checkPrivacy, setCheckPrivacy] = useState(false);
  const [checkDPA, setCheckDPA] = useState(false);
  const [checkResp, setCheckResp] = useState(false);
  const [modale, setModale] = useState(null); // "privacy" | "dpa" | null
  const tuttoAccettato = checkPrivacy && checkDPA && checkResp;

  const voci = [
    {
      check: checkPrivacy, setCheck: setCheckPrivacy,
      titolo: "Informativa Privacy",
      testo: "Ho letto l'informativa sul trattamento dei dati personali ai sensi dell'art. 13 GDPR.",
      icona: "🔒",
      linkLabel: "Leggi l'informativa completa →",
      tipoModale: "privacy",
    },
    {
      check: checkDPA, setCheck: setCheckDPA,
      titolo: "Data Processing Agreement",
      testo: "Accetto il DPA ai sensi dell'art. 28 GDPR, che regola il rapporto tra me (Titolare) e SafetyAI (Responsabile).",
      icona: "📄",
      linkLabel: "Leggi il DPA completo →",
      tipoModale: "dpa",
    },
    {
      check: checkResp, setCheck: setCheckResp,
      titolo: "Responsabilità professionale",
      testo: "Comprendo che SafetyAI è uno strumento di supporto. Le decisioni finali e la responsabilità rimangono in capo a me.",
      icona: "⚖️",
      linkLabel: null,
      tipoModale: null,
    },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#0f1117", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "'DM Sans','Segoe UI',sans-serif" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {modale && <ModaleDocumento tipo={modale} onChiudi={() => setModale(null)} />}

      <div style={{ maxWidth: 560, width: "100%" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ width: 56, height: 56, margin: "0 auto 16px", background: "linear-gradient(135deg, #3b82f6, #06b6d4)", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 800, color: "white" }}>S</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.5px" }}>Benvenuto in SafetyAI</div>
          <div style={{ fontSize: 14, color: "#475569", marginTop: 8, lineHeight: 1.6 }}>Il gestionale HSE per professionisti della sicurezza sul lavoro</div>
        </div>

        {/* Card consensi */}
        <div style={{ background: "#161b27", border: "1px solid #1e2535", borderRadius: 16, overflow: "hidden", marginBottom: 20 }}>
          <div style={{ padding: "16px 24px", borderBottom: "1px solid #1e2535", background: "#0f111780" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9" }}>Prima di iniziare, leggi e accetta</div>
            <div style={{ fontSize: 12, color: "#475569", marginTop: 2 }}>Obbligatorio per l'utilizzo professionale del servizio</div>
          </div>

          <div style={{ padding: "8px 0" }}>
            {voci.map((item, i, arr) => (
              <div key={i} style={{ padding: "16px 24px", borderBottom: i < arr.length - 1 ? "1px solid #1e253540" : "none", background: item.check ? "#3b82f608" : "transparent" }}>
                <div style={{ display: "flex", gap: 14, cursor: "pointer" }} onClick={() => item.setCheck(!item.check)}>
                  {/* Checkbox */}
                  <div style={{
                    width: 20, height: 20, borderRadius: 5, flexShrink: 0, marginTop: 2,
                    border: `2px solid ${item.check ? "#3b82f6" : "#334155"}`,
                    background: item.check ? "#3b82f6" : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.15s",
                  }}>
                    {item.check && <span style={{ color: "white", fontSize: 12, fontWeight: 800 }}>✓</span>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 16 }}>{item.icona}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9" }}>{item.titolo}</span>
                    </div>
                    <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.6 }}>{item.testo}</div>
                  </div>
                </div>

                {/* Link leggi documento */}
                {item.tipoModale && (
                  <div style={{ marginTop: 10, marginLeft: 34 }}>
                    <button
                      onClick={e => { e.stopPropagation(); setModale(item.tipoModale); }}
                      style={{ background: "none", border: "none", color: "#3b82f6", fontSize: 12, cursor: "pointer", fontFamily: "inherit", padding: 0, textDecoration: "underline" }}>
                      {item.linkLabel}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: "12px 16px", marginBottom: 20, background: "#f59e0b08", border: "1px solid #f59e0b20", borderRadius: 10, fontSize: 12, color: "#94a3b8", lineHeight: 1.6 }}>
          Puoi consultare i documenti in qualsiasi momento dalla sezione <strong style={{ color: "#f1f5f9" }}>🔒 Privacy & DPA</strong> nella sidebar.
        </div>

        <button
          onClick={() => { if (tuttoAccettato) { accettaPrivacy(); onAccetta(); } }}
          disabled={!tuttoAccettato}
          style={{
            width: "100%", padding: "15px",
            background: tuttoAccettato ? "linear-gradient(135deg, #3b82f6, #06b6d4)" : "#1e2535",
            border: "none", borderRadius: 12,
            color: tuttoAccettato ? "white" : "#334155",
            fontSize: 15, fontWeight: 800,
            cursor: tuttoAccettato ? "pointer" : "not-allowed",
            fontFamily: "inherit", transition: "all 0.2s",
          }}>
          {tuttoAccettato ? "Inizia a usare SafetyAI →" : "Leggi e accetta tutti e tre i punti per continuare"}
        </button>
      </div>
    </div>
  );
}

// ─── ESTRAZIONE TESTO DA PDF ──────────────────────────────────────────────────
async function estraiTestoPDF(file, maxPagine = 30) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        if (!window.pdfjsLib) {
          await new Promise((res, rej) => {
            const script = document.createElement("script");
            script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
            script.onload = res; script.onerror = rej;
            document.head.appendChild(script);
          });
          window.pdfjsLib.GlobalWorkerOptions.workerSrc =
            "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
        }
        const arrayBuffer = e.target.result;
        const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const numPagine = Math.min(pdf.numPages, maxPagine);
        let testo = `[PDF: ${file.name} — ${pdf.numPages} pagine totali, analizzate le prime ${numPagine}]\n\n`;
        for (let i = 1; i <= numPagine; i++) {
          const pagina = await pdf.getPage(i);
          const contenuto = await pagina.getTextContent();
          testo += `--- Pagina ${i} ---\n${contenuto.items.map(item => item.str).join(" ")}\n\n`;
        }
        resolve(testo);
      } catch (err) {
        console.error("Errore estrazione PDF:", err);
        resolve(null);
      }
    };
    reader.readAsArrayBuffer(file);
  });
}

// ─── ANALISI AI DOCUMENTI AZIENDA ────────────────────────────────────────────
async function analizzaDocumentiAzienda(visuraFile, dvrFile) {
  let testoVisura = "", testoDVR = "";
  if (visuraFile?.type === "application/pdf") testoVisura = await estraiTestoPDF(visuraFile, 5) || "";
  if (dvrFile?.type === "application/pdf") testoDVR = await estraiTestoPDF(dvrFile, 30) || "";

  const prompt = `Sei un esperto di sicurezza sul lavoro e diritto societario italiano.
Analizza i seguenti documenti e restituisci SOLO un oggetto JSON valido, senza backtick, senza markdown.

${testoVisura ? `=== VISURA CAMERALE ===\n${testoVisura}` : ""}
${testoDVR ? `=== DVR (prime pagine) ===\n${testoDVR}` : ""}

JSON da restituire:
{
  "nome": "ragione sociale completa",
  "piva": "partita IVA solo numeri",
  "sede": "indirizzo sede legale completo",
  "ateco": "codice ATECO con descrizione",
  "settore": "settore in una parola",
  "dipendenti": numero intero o null,
  "figure": {
    "datoreLavoro": "nome cognome o null",
    "rspp": "nome cognome o null",
    "medicoCompetente": "nome cognome o null",
    "rls": "nome cognome o null"
  },
  "rischi": [
    { "categoria": "nome categoria rischio", "descrizione": "descrizione specifica", "livello": "basso|medio|alto" }
  ],
  "note": "info aggiuntive o null"
}`;

  const response = await fetch(`${API_URL}/api/claude`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const data = await response.json();
  const text = data.content?.map(b => b.text || "").join("") || "";
  try { return JSON.parse(text.replace(/```json|```/g, "").trim()); }
  catch { return null; }
}

// ─── CREA AZIENDA ─────────────────────────────────────────────────────────────
function CreaAzienda({ onCreata, isFirst = false }) {
  const [step, setStep] = useState("upload");
  const [visuraFile, setVisuraFile] = useState(null);
  const [dvrFile, setDvrFile] = useState(null);
  const [analizzando, setAnalizzando] = useState(false);
  const [erroreAnalisi, setErroreAnalisi] = useState(false);
  const [form, setForm] = useState({
    nome: "", piva: "", sede: "", ateco: "", settore: "", dipendenti: "",
    figure: { datoreLavoro: "", rspp: "", medicoCompetente: "", rls: "" },
    rischi: [],
  });

  const LIVELLI = ["basso", "medio", "alto"];
  const LIVELLO_CFG = {
    basso: { color: "#10b981", bg: "#10b98115" },
    medio: { color: "#f59e0b", bg: "#f59e0b15" },
    alto:  { color: "#ef4444", bg: "#ef444415" },
  };

  async function avviaAnalisi() {
    setAnalizzando(true); setErroreAnalisi(false);
    try {
      const risultato = await analizzaDocumentiAzienda(visuraFile, dvrFile);
      if (risultato) {
        setForm({
          nome: risultato.nome || "",
          piva: risultato.piva || "",
          sede: risultato.sede || "",
          ateco: risultato.ateco || "",
          settore: risultato.settore || "",
          dipendenti: risultato.dipendenti || "",
          figure: {
            datoreLavoro: risultato.figure?.datoreLavoro || "",
            rspp: risultato.figure?.rspp || "",
            medicoCompetente: risultato.figure?.medicoCompetente || "",
            rls: risultato.figure?.rls || "",
          },
          rischi: (risultato.rischi || []).map(r => ({ ...r, id: genId("r") })),
        });
        setStep("revisione");
      } else { setErroreAnalisi(true); }
    } catch { setErroreAnalisi(true); }
    finally { setAnalizzando(false); }
  }

  function salvaAzienda() {
    const nuova = creaAzienda({ ...form, dipendenti: form.dipendenti ? parseInt(form.dipendenti) : null });
    onCreata(nuova);
  }

  const inputStyle = { width: "100%", padding: "10px 14px", background: "#0f1117", border: "1px solid #1e2535", borderRadius: 8, color: "#cbd5e1", fontSize: 13, fontFamily: "inherit", boxSizing: "border-box" };
  const labelStyle = { fontSize: 11, color: "#64748b", fontWeight: 700, display: "block", marginBottom: 6, letterSpacing: "0.3px" };

  const DropZone = ({ file, setFile, inputId, label, sublabel }) => (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", marginBottom: 8 }}>
        {label} <span style={{ color: "#475569", fontWeight: 400 }}>{sublabel}</span>
      </div>
      <div onClick={() => document.getElementById(inputId).click()}
        style={{ border: `2px dashed ${file ? "#10b981" : "#1e2535"}`, borderRadius: 12, padding: "20px 24px", textAlign: "center", cursor: "pointer", background: file ? "#10b98108" : "#161b27", transition: "all 0.2s" }}>
        <input id={inputId} type="file" accept=".pdf" style={{ display: "none" }} onChange={e => setFile(e.target.files[0])} />
        {file ? (
          <div>
            <div style={{ fontSize: 13, color: "#10b981", fontWeight: 600 }}>✓ {file.name}</div>
            <div style={{ fontSize: 11, color: "#475569", marginTop: 4 }}>{(file.size / 1024 / 1024).toFixed(1)} MB</div>
          </div>
        ) : (
          <div style={{ fontSize: 13, color: "#475569" }}>Clicca o trascina il PDF qui</div>
        )}
      </div>
    </div>
  );

  if (step === "upload") return (
    <div style={{ maxWidth: 560, margin: "0 auto" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      {isFirst && (
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#f1f5f9", marginBottom: 8 }}>Aggiungi la tua prima azienda</div>
          <div style={{ fontSize: 14, color: "#475569", lineHeight: 1.6 }}>Carica la visura camerale e il DVR — l'AI crea il profilo completo automaticamente.</div>
        </div>
      )}
      <DropZone file={visuraFile} setFile={setVisuraFile} inputId="input-visura" label="📄 Visura camerale" sublabel="(consigliata)" />
      <DropZone file={dvrFile} setFile={setDvrFile} inputId="input-dvr" label="📋 DVR aziendale" sublabel="(anche centinaia di pagine — analizzate le prime 30)" />
      {erroreAnalisi && (
        <div style={{ padding: "12px 16px", background: "#ef444415", border: "1px solid #ef444430", borderRadius: 8, fontSize: 12, color: "#fca5a5", marginBottom: 16 }}>
          ⚠ Errore durante l'analisi. Puoi procedere con l'inserimento manuale.
        </div>
      )}
      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={() => setStep("manuale")} style={{ flex: 1, padding: "12px", background: "#161b27", border: "1px solid #1e2535", borderRadius: 10, color: "#64748b", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
          Inserisci manualmente
        </button>
        <button onClick={avviaAnalisi} disabled={(!visuraFile && !dvrFile) || analizzando}
          style={{ flex: 2, padding: "12px", background: (visuraFile || dvrFile) && !analizzando ? "linear-gradient(135deg, #3b82f6, #06b6d4)" : "#1e2535", border: "none", borderRadius: 10, color: (visuraFile || dvrFile) && !analizzando ? "white" : "#334155", fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          {analizzando ? <><span style={{ display: "inline-block", animation: "spin 0.8s linear infinite" }}>⟳</span>Analisi in corso...</> : "⚡ Analizza con AI →"}
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: 640, margin: "0 auto" }}>
      {step === "revisione" && (
        <div style={{ padding: "12px 16px", background: "#10b98110", border: "1px solid #10b98130", borderRadius: 10, marginBottom: 24, fontSize: 12, color: "#10b981" }}>
          ✓ L'AI ha estratto i dati. Verifica e correggi se necessario, poi salva.
        </div>
      )}
      {step === "manuale" && (
        <div style={{ marginBottom: 24, display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => setStep("upload")} style={{ background: "none", border: "none", color: "#3b82f6", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>← Torna</button>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#f1f5f9" }}>Inserimento manuale</div>
        </div>
      )}

      {/* Dati aziendali */}
      <div style={{ background: "#161b27", border: "1px solid #1e2535", borderRadius: 12, padding: "20px 24px", marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#3b82f6", letterSpacing: "0.5px", marginBottom: 16 }}>DATI AZIENDALI</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>RAGIONE SOCIALE *</label>
            <input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Es. Vetri Italiani S.r.l." style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>PARTITA IVA</label>
            <input value={form.piva} onChange={e => setForm(f => ({ ...f, piva: e.target.value }))} placeholder="12345678901" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>DIPENDENTI</label>
            <input type="number" value={form.dipendenti} onChange={e => setForm(f => ({ ...f, dipendenti: e.target.value }))} placeholder="Es. 45" style={inputStyle} />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>SEDE LEGALE</label>
            <input value={form.sede} onChange={e => setForm(f => ({ ...f, sede: e.target.value }))} placeholder="Via Roma 1, 37100 Verona (VR)" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>CODICE ATECO</label>
            <input value={form.ateco} onChange={e => setForm(f => ({ ...f, ateco: e.target.value }))} placeholder="23.13 - Fabbricazione di vetro cavo" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>SETTORE</label>
            <input value={form.settore} onChange={e => setForm(f => ({ ...f, settore: e.target.value }))} placeholder="Es. Vetrario" style={inputStyle} />
          </div>
        </div>
      </div>

      {/* Figure */}
      <div style={{ background: "#161b27", border: "1px solid #1e2535", borderRadius: 12, padding: "20px 24px", marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#a78bfa", letterSpacing: "0.5px", marginBottom: 16 }}>FIGURE DELLA SICUREZZA</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {[["datoreLavoro","DATORE DI LAVORO"],["rspp","RSPP"],["medicoCompetente","MEDICO COMPETENTE"],["rls","RLS"]].map(([key, label]) => (
            <div key={key}>
              <label style={labelStyle}>{label}</label>
              <input value={form.figure[key]} onChange={e => setForm(f => ({ ...f, figure: { ...f.figure, [key]: e.target.value } }))} placeholder="Nome Cognome" style={inputStyle} />
            </div>
          ))}
        </div>
      </div>

      {/* Rischi */}
      <div style={{ background: "#161b27", border: "1px solid #1e2535", borderRadius: 12, padding: "20px 24px", marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#f59e0b", letterSpacing: "0.5px" }}>RISCHI AZIENDALI {form.rischi.length > 0 && `— ${form.rischi.length}`}</div>
          <button onClick={() => setForm(f => ({ ...f, rischi: [...f.rischi, { id: genId("r"), categoria: "", descrizione: "", livello: "medio" }] }))}
            style={{ padding: "5px 12px", background: "#f59e0b15", border: "1px solid #f59e0b30", borderRadius: 6, color: "#f59e0b", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
            + Aggiungi
          </button>
        </div>
        {form.rischi.length === 0 ? (
          <div style={{ textAlign: "center", padding: "20px", fontSize: 13, color: "#334155" }}>Nessun rischio — aggiungili manualmente o carica il DVR</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {form.rischi.map(r => (
              <div key={r.id} style={{ background: "#0f1117", borderRadius: 8, padding: "10px 12px", display: "flex", gap: 10, alignItems: "center" }}>
                <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 2fr auto", gap: 8 }}>
                  <input value={r.categoria} onChange={e => setForm(f => ({ ...f, rischi: f.rischi.map(x => x.id === r.id ? { ...x, categoria: e.target.value } : x) }))} placeholder="Categoria" style={{ ...inputStyle, fontSize: 12 }} />
                  <input value={r.descrizione} onChange={e => setForm(f => ({ ...f, rischi: f.rischi.map(x => x.id === r.id ? { ...x, descrizione: e.target.value } : x) }))} placeholder="Descrizione" style={{ ...inputStyle, fontSize: 12 }} />
                  <select value={r.livello} onChange={e => setForm(f => ({ ...f, rischi: f.rischi.map(x => x.id === r.id ? { ...x, livello: e.target.value } : x) }))}
                    style={{ padding: "8px 10px", background: LIVELLO_CFG[r.livello]?.bg || "#1e2535", border: `1px solid ${LIVELLO_CFG[r.livello]?.color || "#334155"}40`, borderRadius: 6, color: LIVELLO_CFG[r.livello]?.color || "#64748b", fontSize: 12, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }}>
                    {LIVELLI.map(l => <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>)}
                  </select>
                </div>
                <button onClick={() => setForm(f => ({ ...f, rischi: f.rischi.filter(x => x.id !== r.id) }))} style={{ background: "none", border: "none", color: "#334155", fontSize: 16, cursor: "pointer", padding: "0 4px" }}>✕</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <button onClick={salvaAzienda} disabled={!form.nome.trim()}
        style={{ width: "100%", padding: "14px", background: form.nome.trim() ? "linear-gradient(135deg, #10b981, #06b6d4)" : "#1e2535", border: "none", borderRadius: 12, color: form.nome.trim() ? "white" : "#334155", fontSize: 15, fontWeight: 800, cursor: form.nome.trim() ? "pointer" : "not-allowed", fontFamily: "inherit" }}>
        ✓ Crea profilo azienda
      </button>
    </div>
  );
}

export { SchermataBenvenuto, CreaAzienda };
