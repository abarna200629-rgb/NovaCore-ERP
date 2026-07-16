function ConfirmDialog({

  message,

  onConfirm,

  onCancel

}) {

  return (

    <div className="card p-4">

      <h5>

        {message}

      </h5>

      <div className="mt-3">

        <button
          className="btn btn-danger me-2"
          onClick={onConfirm}
        >

          Yes

        </button>

        <button
          className="btn btn-secondary"
          onClick={onCancel}
        >

          No

        </button>

      </div>

    </div>

  );
}

export default ConfirmDialog;