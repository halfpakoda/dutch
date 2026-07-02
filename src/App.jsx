import { useState } from 'react';
import Upload from './components/Upload';
import Scanning from './components/Scanning';
import ReviewItems from './components/ReviewItems';
import AddPeople from './components/AddPeople';
import AssignItems from './components/AssignItems';
import TaxSettings from './components/TaxSettings';
import Results from './components/Results';

const SCREENS = ['upload', 'scanning', 'review', 'people', 'assign', 'tax', 'results'];

function App() {
  const [screenIndex, setScreenIndex] = useState(0);
  const [image, setImage] = useState(null);
  const [items, setItems] = useState([]);
  const [charges, setCharges] = useState([]);
  const [people, setPeople] = useState([]);
  const [scanError, setScanError] = useState(null);
  const [scanErrorCode, setScanErrorCode] = useState(null);

  const screen = SCREENS[screenIndex];
  const goTo = (name) => setScreenIndex(SCREENS.indexOf(name));

  const reset = () => {
    setImage(null);
    setItems([]);
    setCharges([]);
    setPeople([]);
    setScanError(null);
    setScanErrorCode(null);
    setScreenIndex(0);
  };

  return (
    <>
      <div className="header">
        <div className="brand">dutch.</div>
      </div>

      {screen === 'upload' && (
        <Upload
          onImageReady={(img) => {
            setImage(img);
            setScanError(null);
            setScanErrorCode(null);
            goTo('scanning');
          }}
          scanError={scanError}
          scanErrorCode={scanErrorCode}
        />
      )}

      {screen === 'scanning' && (
        <Scanning
          image={image}
          onScanned={({ items: scannedItems, charges: scannedCharges }) => {
            setItems(scannedItems);
            setCharges(scannedCharges);
            goTo('review');
          }}
          onError={(err) => {
            setScanErrorCode(err.code || null);
            setScanError(
              err.code === 'not_a_bill'
                ? "we don't think that's a bill. oops if it is."
                : err.message || 'something went wrong scanning that bill'
            );
            goTo('upload');
          }}
        />
      )}

      {screen === 'review' && (
        <ReviewItems
          items={items}
          charges={charges}
          image={image}
          onChange={(newItems, newCharges) => {
            setItems(newItems);
            setCharges(newCharges);
          }}
          onNext={() => goTo('people')}
          onBack={() => goTo('upload')}
        />
      )}

      {screen === 'people' && (
        <AddPeople
          people={people}
          onChange={setPeople}
          onNext={() => goTo('assign')}
          onBack={() => goTo('review')}
        />
      )}

      {screen === 'assign' && (
        <AssignItems
          items={items}
          people={people}
          onChange={setItems}
          onNext={() => goTo('tax')}
          onBack={() => goTo('people')}
        />
      )}

      {screen === 'tax' && (
        <TaxSettings
          charges={charges}
          onChange={setCharges}
          onNext={() => goTo('results')}
          onBack={() => goTo('assign')}
        />
      )}

      {screen === 'results' && (
        <Results items={items} people={people} charges={charges} onReset={reset} />
      )}
    </>
  );
}

export default App;
