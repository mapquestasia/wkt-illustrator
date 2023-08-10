export const FileUploader = ({ setWktData }) => {
  const handleFileChosen = (file) => {
    if (file === null) return;

    const reader = new FileReader();
    reader.readAsText(file, "UTF-8");
    reader.onload = (e) => {
      const wktData = e.target.result;
      setWktData(wktData);
    };
  };

  return (
    <div>
      <form>
        <input
          type="file"
          onChange={(e) => {
            handleFileChosen(e.target.files[0]);
          }}
        />
      </form>
    </div>
  );
};
