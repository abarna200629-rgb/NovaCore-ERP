function DataTable({

  columns,

  data

}) {

  return (

    <table
      className="table table-bordered table-hover"
    >

      <thead>

        <tr>

          {columns.map(
            (column) => (

              <th key={column}>

                {column}

              </th>

            )
          )}

        </tr>

      </thead>

      <tbody>

        {data.map(
          (row, index) => (

            <tr key={index}>

              {Object.values(row)
                .map(
                  (
                    value,
                    i
                  ) => (

                    <td key={i}>

                      {value}

                    </td>

                  )
                )}

            </tr>

          )
        )}

      </tbody>

    </table>

  );
}

export default DataTable;