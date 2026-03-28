import logging
from datetime import datetime
from pathlib import Path
from typing import Optional, TextIO

from constants import LOG_FOLDER


class DailyFileHandler(logging.Handler):
    def __init__(self, log_dir: Path | str, file_prefix: str = "backend") -> None:
        super().__init__()
        self.log_dir = Path(log_dir)
        self.file_prefix = file_prefix
        self.current_date: Optional[str] = None
        self.stream: Optional[TextIO] = None
        self.log_dir.mkdir(parents=True, exist_ok=True)

    def _log_path_for_date(self, date_str: str) -> Path:
        return self.log_dir / f"{self.file_prefix}-{date_str}.log"

    def _open_stream_for_date(self, date_str: str) -> None:
        if self.stream:
            self.stream.close()
        log_path = self._log_path_for_date(date_str)
        self.stream = open(log_path, "a", encoding="utf-8")
        self.current_date = date_str

    def emit(self, record: logging.LogRecord) -> None:
        try:
            record_date = datetime.fromtimestamp(record.created).strftime("%Y-%m-%d")

            if self.current_date != record_date or self.stream is None:
                self._open_stream_for_date(record_date)

            message = self.format(record)
            self.stream.write(message + "\n")
            self.stream.flush()
        except Exception:
            self.handleError(record)

    def close(self) -> None:
        try:
            if self.stream:
                self.stream.close()
                self.stream = None
        finally:
            super().close()


def setup_logging(level: int = logging.INFO) -> None:
    root_logger = logging.getLogger()

    if getattr(root_logger, "_daily_logger_configured", False):
        return

    root_logger.setLevel(level)

    formatter = logging.Formatter(
        "%(asctime)s | %(levelname)s | %(name)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    daily_file_handler = DailyFileHandler(LOG_FOLDER)
    daily_file_handler.setFormatter(formatter)

    stream_handler = logging.StreamHandler()
    stream_handler.setFormatter(formatter)

    root_logger.addHandler(daily_file_handler)
    root_logger.addHandler(stream_handler)
    root_logger._daily_logger_configured = True


def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(name)