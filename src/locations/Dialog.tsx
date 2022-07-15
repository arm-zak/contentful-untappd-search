import React, {useEffect, useState} from 'react';
import {EntityList} from '@contentful/f36-components';
import {DialogExtensionSDK} from '@contentful/app-sdk';
import { /* useCMA, */ useSDK} from '@contentful/react-apps-toolkit';

const Dialog = () => {
    const sdk = useSDK<DialogExtensionSDK>();
    const [items, setItems] = useState<any[]>([]);
    /*
       To use the cma, inject it as follows.
       If it is not needed, you can remove the next line.
    */

    // const cma = useCMA();

    useEffect(() => {
        if (sdk.parameters.invocation !== null) {
            // @ts-ignore
            setItems(sdk.parameters.invocation.beers.items)
        }
    }, [sdk.parameters.invocation]);

    return <EntityList>
        {items.map((item) =>
            <EntityList.Item
                key={item.beer.bid}
                className="item-search-option"
                title={item.beer.beer_name}
                description={item.brewery.brewery_name}
                thumbnailUrl={item.beer.beer_label}
                onClick={() =>  sdk.close(item)}
            />
        )}
    </EntityList>;
};

export default Dialog;
